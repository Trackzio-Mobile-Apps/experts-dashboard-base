import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect } from "vite";

/** Keep in sync with `src/lib/expert/expertCookie.ts`. */
const EXPERT_JWT_COOKIE = "coinzy_expert_jwt";
const COUNTRIES_API_URL = "https://countriesnow.space/api/v0.1/countries/iso";

function getBackendBaseUrl(): string {
  const base =
    process.env.EXPERT_API_BASE_URL ??
    process.env.VITE_EXPERT_API_BASE_URL ??
    process.env.VITE_EXPERT_SOCKET_URL ??
    "https://coinzy-experts-api.trackzio.com";
  return base.replace(/\/$/, "");
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

function cookieHeader(
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    path?: string;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
    maxAge?: number;
  },
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path ?? "/"}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) {
    parts.push(
      `SameSite=${options.sameSite[0]!.toUpperCase()}${options.sameSite.slice(1)}`,
    );
  }
  return parts.join("; ");
}

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

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return true;
  }
  if (
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.")
  ) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
    return true;
  }
  return false;
}

function isAllowedMediaUrl(url: URL): boolean {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return false;
  }
  if (isPrivateHost(url.hostname)) {
    return false;
  }
  return true;
}

async function handleSession(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const method = (req.method ?? "GET").toUpperCase();
  const cookies = parseCookies(req.headers.cookie);
  const secure = process.env.NODE_ENV === "production";

  if (method === "GET") {
    sendJson(res, 200, {
      authenticated: Boolean(cookies[EXPERT_JWT_COOKIE]),
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
        "Set-Cookie": cookieHeader(EXPERT_JWT_COOKIE, token, {
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
        "Set-Cookie": cookieHeader(EXPERT_JWT_COOKIE, "", {
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
  const url = getBackendBaseUrl();
  sendJson(res, 200, { url });
  return true;
}

async function handleMedia(
  req: IncomingMessage,
  res: ServerResponse,
  urlObj: URL,
): Promise<boolean> {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[EXPERT_JWT_COOKIE];
  if (!token) {
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
    const upstream = await fetch(target.toString(), { cache: "no-store" });
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
  const token = cookies[EXPERT_JWT_COOKIE];
  const bodyBuffer =
    method === "GET" || method === "HEAD" ? undefined : await readBody(req);

  const target = new URL(`/${path}`, getBackendBaseUrl());
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
      message:
        "Unable to reach the expert API. Check EXPERT_API_BASE_URL and backend availability.",
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
