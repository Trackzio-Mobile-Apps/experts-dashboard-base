import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  cookieHeader,
  getJwtCookieName,
  parseCookies,
} from "../_lib/expertBackend";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const method = (req.method ?? "GET").toUpperCase();
  const cookies = parseCookies(req.headers.cookie);
  const cookieName = getJwtCookieName();
  const secure = process.env.NODE_ENV === "production";

  if (method === "GET") {
    return res.status(200).json({
      authenticated: Boolean(cookies[cookieName]),
    });
  }

  if (method === "POST") {
    let parsed: { token?: unknown } = {};
    try {
      const body = req.body as { token?: unknown } | string | undefined;
      parsed =
        typeof body === "string"
          ? (JSON.parse(body || "{}") as { token?: unknown })
          : (body ?? {});
    } catch {
      return res
        .status(400)
        .json({ error: true, message: "Invalid request body." });
    }
    const token =
      typeof parsed.token === "string" ? parsed.token.trim() : "";

    if (!token) {
      return res
        .status(400)
        .json({ error: true, message: "Token is required." });
    }

    res.setHeader(
      "Set-Cookie",
      cookieHeader(cookieName, token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure,
        maxAge: 60 * 60 * 24 * 7,
      }),
    );
    return res.status(200).json({ ok: true });
  }

  if (method === "DELETE") {
    res.setHeader(
      "Set-Cookie",
      cookieHeader(cookieName, "", {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure,
        maxAge: 0,
      }),
    );
    return res.status(200).json({ ok: true });
  }

  return res
    .status(405)
    .json({ error: true, message: "Method not allowed." });
}
