import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  fetchRemoteMedia,
  hasExpertMediaAuth,
  isAllowedMediaUrl,
} from "../_lib/expertBackend";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if ((req.method ?? "GET").toUpperCase() !== "GET") {
    return res
      .status(405)
      .json({ error: true, message: "Method not allowed." });
  }

  if (!hasExpertMediaAuth(req.headers.cookie, req.headers.authorization)) {
    return res.status(401).json({ error: true, message: "Unauthorized." });
  }

  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
  if (!rawUrl) {
    return res.status(400).json({ error: true, message: "Missing url." });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: true, message: "Invalid url." });
  }

  if (!isAllowedMediaUrl(target)) {
    return res.status(403).json({ error: true, message: "Forbidden url." });
  }

  try {
    const upstream = await fetchRemoteMedia(target.toString());
    if (!upstream.ok) {
      return res
        .status(502)
        .json({ error: true, message: "Unable to fetch media." });
    }

    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";
    const body = Buffer.from(await upstream.arrayBuffer());
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.end(body);
  } catch {
    return res
      .status(502)
      .json({ error: true, message: "Unable to fetch media." });
  }
}
