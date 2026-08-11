/** Decode a JWT payload without verification (used only to key server-side storage). */
export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const segment = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = segment + "=".repeat((4 - (segment.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    const parsed: unknown = JSON.parse(json);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Resolve expert Mongo id from an expert JWT payload. */
export function expertIdFromJwt(token: string | undefined | null): string | null {
  if (!token?.trim()) return null;
  const payload = decodeJwtPayload(token.trim());
  if (!payload) return null;

  for (const key of ["expertId", "id", "sub", "_id"]) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}
