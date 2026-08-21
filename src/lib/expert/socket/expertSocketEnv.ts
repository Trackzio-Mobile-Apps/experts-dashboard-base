import { appEnv } from "@/config/appEnv";

const LOG_PREFIX = "[expert-socket]";

let cachedBaseUrl: string | null = null;
let resolveInFlight: Promise<string> | null = null;
let startupLogged = false;

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function getSocketUrlFromEnv(): string {
  return normalizeUrl(appEnv.socketUrl || appEnv.apiBaseUrl);
}

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

/** Resolve Socket.IO URL from env (`SOCKET_URL` or `API_BASE_URL`), else server. */
export async function resolveExpertSocketBaseUrl(): Promise<string> {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  const fromEnv = getSocketUrlFromEnv();
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

export function logExpertSocketStartup(options: {
  url: string;
  expertId: string;
  source: "server-config" | "missing";
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
      `Source: ${options.source}`,
  );
}

export function resetExpertSocketStartupLog(): void {
  startupLogged = false;
}
