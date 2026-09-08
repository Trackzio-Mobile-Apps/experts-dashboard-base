import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect } from "vite";
import {
  API_UNAVAILABLE_MESSAGE,
  cookieHeader,
  COUNTRIES_API_URL,
  fetchRemoteMedia,
  getApiBaseUrl,
  getJwtCookieName,
  getSocketUrl,
  hasExpertMediaAuth,
  isAllowedMediaUrl,
  parseCookies,
} from "../api/_lib/expertBackend";

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sendJson(
  res: ServerResponse,
  status: number,
  payload: unknown,
  extraHeaders?: Record<string, string>,
) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      res.setHeader(key, value);
    }
  }
  res.end(body);
}

async function handleSession(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const method = (req.method ?? "GET").toUpperCase();
  const cookies = parseCookies(req.headers.cookie);
  const cookieName = getJwtCookieName();
  const secure = process.env.NODE_ENV === "production";

  if (method === "GET") {
    sendJson(res, 200, {
      authenticated: Boolean(cookies[cookieName]),
    });
    return true;
  }

  if (method === "POST") {
    const raw = await readBody(req);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8") || "{}");
    } catch {
      sendJson(res, 400, { error: true, message: "Invalid request body." });
      return true;
    }

    const token =
      typeof body === "object" &&
      body !== null &&
      "token" in body &&
      typeof (body as { token: unknown }).token === "string"
        ? (body as { token: string }).token.trim()
        : "";

    if (!token) {
      sendJson(res, 400, { error: true, message: "Token is required." });
      return true;
    }

    sendJson(
      res,
      200,
      { ok: true },
      {
        "Set-Cookie": cookieHeader(cookieName, token, {
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure,
          maxAge: 60 * 60 * 24 * 7,
        }),
      },
    );
    return true;
  }

  if (method === "DELETE") {
    sendJson(
      res,
      200,
      { ok: true },
      {
        "Set-Cookie": cookieHeader(cookieName, "", {
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure,
          maxAge: 0,
        }),
      },
    );
    return true;
  }

  sendJson(res, 405, { error: true, message: "Method not allowed." });
  return true;
}

async function handleSocketConfig(
  _req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  sendJson(res, 200, { url: getSocketUrl() });
  return true;
}

async function handleMedia(
  req: IncomingMessage,
  res: ServerResponse,
  urlObj: URL,
): Promise<boolean> {
  if (!hasExpertMediaAuth(req.headers.cookie, req.headers.authorization)) {
    sendJson(res, 401, { error: true, message: "Unauthorized." });
    return true;
  }

  const rawUrl = urlObj.searchParams.get("url");
  if (!rawUrl) {
    sendJson(res, 400, { error: true, message: "Missing url." });
    return true;
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    sendJson(res, 400, { error: true, message: "Invalid url." });
    return true;
  }

  if (!isAllowedMediaUrl(target)) {
    sendJson(res, 403, { error: true, message: "Forbidden url." });
    return true;
  }

  try {
    const upstream = await fetchRemoteMedia(target.toString());
    if (!upstream.ok) {
      sendJson(res, 502, { error: true, message: "Unable to fetch media." });
      return true;
    }

    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";
    const body = Buffer.from(await upstream.arrayBuffer());
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.end(body);
  } catch {
    sendJson(res, 502, { error: true, message: "Unable to fetch media." });
  }
  return true;
}

async function handleCountries(
  _req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  try {
    const response = await fetch(COUNTRIES_API_URL, { cache: "no-store" });
    if (!response.ok) {
      sendJson(res, 502, {
        error: true,
        message: "Countries service returned an error.",
        data: [],
      });
      return true;
    }

    const payload = (await response.json()) as {
      error: boolean;
      data: Array<{ name: string; Iso2: string }>;
    };

    if (payload.error || !Array.isArray(payload.data)) {
      sendJson(res, 502, {
        error: true,
        message: "Unable to load countries.",
        data: [],
      });
      return true;
    }

    const countries = payload.data
      .filter(
        (item) =>
          typeof item.name === "string" &&
          item.name.trim() &&
          typeof item.Iso2 === "string" &&
          item.Iso2.trim(),
      )
      .map((item) => ({
        code: item.Iso2.trim().toUpperCase(),
        name: item.name.trim(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    sendJson(res, 200, {
      error: false,
      message: null,
      data: { countries },
    });
  } catch {
    sendJson(res, 502, {
      error: true,
      message: "Unable to reach countries service.",
      data: [],
    });
  }
  return true;
}

async function handleExpertProxy(
  req: IncomingMessage,
  res: ServerResponse,
  urlObj: URL,
): Promise<boolean> {
  const method = (req.method ?? "GET").toUpperCase();
  const path = urlObj.pathname.replace(/^\/api\/expert\/?/, "");
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[getJwtCookieName()];
  const bodyBuffer =
    method === "GET" || method === "HEAD" ? undefined : await readBody(req);

  const target = new URL(`/${path}`, getApiBaseUrl());
  target.search = urlObj.search;

  const headers = new Headers();
  const authorization = req.headers.authorization;
  if (authorization) {
    headers.set("authorization", authorization);
  } else if (path !== "experts/login" && token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const contentType = req.headers["content-type"];
  if (contentType) {
    headers.set("content-type", contentType);
  }

  try {
    const backendResponse = await fetch(target, {
      method,
      headers,
      body: bodyBuffer ? new Uint8Array(bodyBuffer) : undefined,
      cache: "no-store",
    });

    const responseBody = Buffer.from(await backendResponse.arrayBuffer());
    const responseContentType = backendResponse.headers.get("content-type");
    res.statusCode = backendResponse.status;
    if (responseContentType) {
      res.setHeader("Content-Type", responseContentType);
    }
    res.end(responseBody);
  } catch {
    sendJson(res, 502, {
      error: true,
      message: API_UNAVAILABLE_MESSAGE,
      data: null,
    });
  }

  return true;
}

export function createExpertApiMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    try {
      const host = req.headers.host ?? "localhost";
      const urlObj = new URL(req.url ?? "/", `http://${host}`);
      const pathname = urlObj.pathname;

      if (pathname === "/api/countries") {
        await handleCountries(req, res);
        return;
      }

      if (pathname === "/api/expert/session") {
        await handleSession(req, res);
        return;
      }

      if (pathname === "/api/expert/socket-config") {
        await handleSocketConfig(req, res);
        return;
      }

      if (pathname === "/api/expert/media") {
        await handleMedia(req, res, urlObj);
        return;
      }

      if (pathname.startsWith("/api/expert/")) {
        await handleExpertProxy(req, res, urlObj);
        return;
      }

      next();
    } catch (error) {
      console.error("[expert-api-middleware]", error);
      if (!res.headersSent) {
        sendJson(res, 500, {
          error: true,
          message: "Internal server error.",
          data: null,
        });
      }
    }
  };
}
