/** RFC 2606 reserved names used as dummy/seed media hosts. */
export function isPlaceholderMediaHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  return (
    host === "example.com" ||
    host.endsWith(".example.com") ||
    host === "example.net" ||
    host.endsWith(".example.net") ||
    host === "example.org" ||
    host.endsWith(".example.org")
  );
}

/** Dummy or unparseable URLs that must not be fetched for display or PDF. */
export function isUnusableMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return false;
  if (trimmed.startsWith("/")) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return true;
    }
    return isPlaceholderMediaHost(parsed.hostname);
  } catch {
    return true;
  }
}
