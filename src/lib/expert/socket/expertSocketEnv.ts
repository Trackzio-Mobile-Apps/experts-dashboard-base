const LOG_PREFIX = "[expert-socket]";

let cachedBaseUrl: string | null = null;
let resolveInFlight: Promise<string> | null = null;
let startupLogged = false;

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Read socket URL from VITE_* vars inlined at build/dev startup. */
export function getExpertSocketBaseUrlFromEnv(): string {
  const url =
    import.meta.env.VITE_EXPERT_SOCKET_URL ??
    import.meta.env.VITE_EXPERT_API_BASE_URL ??
    "";
  return normalizeUrl(url);
}

/** Fetch socket URL from the Vite API middleware (uses EXPERT_API_BASE_URL). */
async function fetchExpertSocketBaseUrlFromServer(): Promise<string> {
  const response = await fetch("/api/expert/socket-config", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return "";
  }

  const payload = (await response.json()) as { url?: string };
  return normalizeUrl(typeof payload.url === "string" ? payload.url : "");
}

/**
 * Resolve the browser Socket.IO base URL.
 * 1. Cached value
 * 2. VITE_* env
 * 3. GET /api/expert/socket-config (reads server EXPERT_API_BASE_URL)
 */
export async function resolveExpertSocketBaseUrl(): Promise<string> {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  const fromEnv = getExpertSocketBaseUrlFromEnv();
  if (fromEnv) {
    cachedBaseUrl = fromEnv;
    return fromEnv;
  }

  if (!resolveInFlight) {
    resolveInFlight = fetchExpertSocketBaseUrlFromServer()
      .then((url) => {
        if (url) {
          cachedBaseUrl = url;
        }
        return url;
      })
      .finally(() => {
        resolveInFlight = null;
      });
  }

  return resolveInFlight;
}

export function clearExpertSocketBaseUrlCache(): void {
  cachedBaseUrl = null;
}

/** One-time startup log for local debugging. */
export function logExpertSocketStartup(options: {
  url: string;
  expertId: string;
  source: "env" | "server-config" | "missing";
}): void {
  if (startupLogged) return;
  startupLogged = true;

  const expertPreview =
    options.expertId.length > 8
      ? `${options.expertId.slice(0, 8)}…`
      : options.expertId;

  console.log(
    `${LOG_PREFIX}\n` +
      `URL: ${options.url || "(empty)"}\n` +
      `Expert: ${expertPreview}\n` +
      `Environment: ${import.meta.env.MODE}\n` +
      `Source: ${options.source}`,
  );
}

export function resetExpertSocketStartupLog(): void {
  startupLogged = false;
}
