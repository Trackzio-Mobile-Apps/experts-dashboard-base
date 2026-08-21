import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  API_UNAVAILABLE_MESSAGE,
  getApiBaseUrl,
  getJwtCookieName,
  parseCookies,
} from "../_lib/expertBackend";

function pathFromQuery(query: VercelRequest["query"]): string {
  const raw = query.path;
  if (Array.isArray(raw)) return raw.join("/");
  if (typeof raw === "string") return raw;
  return "";
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const method = (req.method ?? "GET").toUpperCase();
  const path = pathFromQuery(req.query);
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[getJwtCookieName()];

  const target = new URL(`/${path}`, getApiBaseUrl());
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path") continue;
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item);
    } else if (typeof value === "string") {
      search.set(key, value);
    }
  }
  target.search = search.toString();

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

  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    if (typeof req.body === "string") {
      body = req.body;
    } else if (req.body != null) {
      body = JSON.stringify(req.body);
      if (!contentType) {
        headers.set("content-type", "application/json");
      }
    }
  }

  try {
    const backendResponse = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const responseBody = Buffer.from(await backendResponse.arrayBuffer());
    const responseContentType = backendResponse.headers.get("content-type");
    res.statusCode = backendResponse.status;
    if (responseContentType) {
      res.setHeader("Content-Type", responseContentType);
    }
    return res.end(responseBody);
  } catch {
    return res.status(502).json({
      error: true,
      message: API_UNAVAILABLE_MESSAGE,
      data: null,
    });
  }
}
