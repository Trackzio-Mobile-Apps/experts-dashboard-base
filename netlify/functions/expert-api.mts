/**
 * Netlify Function — same routes as Vite middleware / Vercel api/*.
 * Mounted at /api/* via `config.path`.
 */
import type { Config, Context } from "@netlify/functions";
import {
  cookieHeader,
  COUNTRIES_API_URL,
  EXPERT_JWT_COOKIE,
  getBackendBaseUrl,
  isAllowedMediaUrl,
  parseCookies,
} from "../../api/_lib/expertBackend";

export const config: Config = {
  path: ["/api/expert/*", "/api/countries"],
};

function json(
  status: number,
  payload: unknown,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

async function handleSession(req: Request): Promise<Response> {
  const method = req.method.toUpperCase();
  const cookies = parseCookies(req.headers.get("cookie") ?? undefined);
  const secure = process.env.NODE_ENV === "production";

  if (method === "GET") {
    return json(200, {
      authenticated: Boolean(cookies[EXPERT_JWT_COOKIE]),
    });
  }

  if (method === "POST") {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: true, message: "Invalid request body." });
    }

    const token =
      typeof body === "object" &&
      body !== null &&
      "token" in body &&
      typeof (body as { token: unknown }).token === "string"
        ? (body as { token: string }).token.trim()
        : "";

    if (!token) {
      return json(400, { error: true, message: "Token is required." });
    }

    return json(
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
  }

  if (method === "DELETE") {
    return json(
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
  }

  return json(405, { error: true, message: "Method not allowed." });
}

async function handleMedia(req: Request, urlObj: URL): Promise<Response> {
  const cookies = parseCookies(req.headers.get("cookie") ?? undefined);
  if (!cookies[EXPERT_JWT_COOKIE]) {
    return json(401, { error: true, message: "Unauthorized." });
  }

  const rawUrl = urlObj.searchParams.get("url");
  if (!rawUrl) {
    return json(400, { error: true, message: "Missing url." });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return json(400, { error: true, message: "Invalid url." });
  }

  if (!isAllowedMediaUrl(target)) {
    return json(403, { error: true, message: "Forbidden url." });
  }

  try {
    const upstream = await fetch(target.toString(), { cache: "no-store" });
    if (!upstream.ok) {
      return json(502, { error: true, message: "Unable to fetch media." });
    }

    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";
    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return json(502, { error: true, message: "Unable to fetch media." });
  }
}

async function handleCountries(): Promise<Response> {
  try {
    const response = await fetch(COUNTRIES_API_URL, { cache: "no-store" });
    if (!response.ok) {
      return json(502, {
        error: true,
        message: "Countries service returned an error.",
        data: [],
      });
    }

    const payload = (await response.json()) as {
      error: boolean;
      data: Array<{ name: string; Iso2: string }>;
    };

    if (payload.error || !Array.isArray(payload.data)) {
      return json(502, {
        error: true,
        message: "Unable to load countries.",
        data: [],
      });
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

    return json(200, {
      error: false,
      message: null,
      data: { countries },
    });
  } catch {
    return json(502, {
      error: true,
      message: "Unable to reach countries service.",
      data: [],
    });
  }
}

async function handleExpertProxy(
  req: Request,
  urlObj: URL,
): Promise<Response> {
  const method = req.method.toUpperCase();
  const path = urlObj.pathname.replace(/^\/api\/expert\/?/, "");
  const cookies = parseCookies(req.headers.get("cookie") ?? undefined);
  const token = cookies[EXPERT_JWT_COOKIE];

  const target = new URL(`/${path}`, getBackendBaseUrl());
  target.search = urlObj.search;

  const headers = new Headers();
  const authorization = req.headers.get("authorization");
  if (authorization) {
    headers.set("authorization", authorization);
  } else if (path !== "experts/login" && token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await req.arrayBuffer();

  try {
    const backendResponse = await fetch(target, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: "no-store",
    });

    const responseBody = await backendResponse.arrayBuffer();
    const responseContentType = backendResponse.headers.get("content-type");
    const outHeaders = new Headers();
    if (responseContentType) {
      outHeaders.set("Content-Type", responseContentType);
    }
    return new Response(responseBody, {
      status: backendResponse.status,
      headers: outHeaders,
    });
  } catch {
    return json(502, {
      error: true,
      message:
        "Unable to reach the expert API. Check EXPERT_API_BASE_URL and backend availability.",
      data: null,
    });
  }
}

export default async function handler(
  req: Request,
  _context: Context,
): Promise<Response> {
  const urlObj = new URL(req.url);
  const pathname = urlObj.pathname;

  try {
    if (pathname === "/api/countries") {
      return handleCountries();
    }
    if (pathname === "/api/expert/session") {
      return handleSession(req);
    }
    if (pathname === "/api/expert/socket-config") {
      return json(200, { url: getBackendBaseUrl() });
    }
    if (pathname === "/api/expert/media") {
      return handleMedia(req, urlObj);
    }
    if (pathname.startsWith("/api/expert/")) {
      return handleExpertProxy(req, urlObj);
    }
    return json(404, { error: true, message: "Not found." });
  } catch (error) {
    console.error("[netlify expert-api]", error);
    return json(500, {
      error: true,
      message: "Internal server error.",
      data: null,
    });
  }
}
