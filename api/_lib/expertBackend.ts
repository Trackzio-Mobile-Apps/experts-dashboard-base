/** Shared helpers for local middleware and Vercel `/api/*` routes. */

export const COUNTRIES_API_URL =
  "https://countriesnow.space/api/v0.1/countries/iso";

function firstEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

function sanitizeSlug(value: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return slug || "expert";
}

/** Expert backend origin. Server-only — never expose to the browser. */
export function getApiBaseUrl(): string {
  return firstEnv("API_BASE_URL", "EXPERT_API_BASE_URL").replace(/\/$/, "");
}

/** Socket.IO origin. Defaults to `API_BASE_URL`. */
export function getSocketUrl(): string {
  return (firstEnv("SOCKET_URL") || getApiBaseUrl()).replace(/\/$/, "");
}

export function getJwtCookieName(): string {
  return `${sanitizeSlug(firstEnv("APP_SLUG") || "expert")}_jwt`;
}

export function parseCookies(
  header: string | undefined,
): Record<string, string> {
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

export function cookieHeader(
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

export function isPrivateHost(hostname: string): boolean {
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

export function isAllowedMediaUrl(url: URL): boolean {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return false;
  }
  if (isPrivateHost(url.hostname)) {
    return false;
  }
  return true;
}

export const API_UNAVAILABLE_MESSAGE =
  "Unable to reach the expert API. Check API_BASE_URL and backend availability.";
