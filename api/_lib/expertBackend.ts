/** Shared helpers for Vercel `/api/*` routes (mirrors Vite middleware). */

export const EXPERT_JWT_COOKIE = "coinzy_expert_jwt";
export const COUNTRIES_API_URL =
  "https://countriesnow.space/api/v0.1/countries/iso";

export function getBackendBaseUrl(): string {
  const base =
    process.env.EXPERT_API_BASE_URL ??
    process.env.VITE_EXPERT_API_BASE_URL ??
    process.env.VITE_EXPERT_SOCKET_URL ??
    "https://coinzy-experts-api.trackzio.com";
  return base.replace(/\/$/, "");
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
