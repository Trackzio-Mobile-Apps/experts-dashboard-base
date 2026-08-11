/**
 * Expert panel API client.
 *
 * Browser requests go through `/api/expert/*` (same origin) to avoid CORS.
 * The JWT is stored in an HttpOnly cookie (`coinzy_expert_jwt`) via
 * `/api/expert/session`; the proxy attaches it when forwarding to the backend.
 */

const BROWSER_API_PREFIX = "/api/expert";
const SESSION_ROUTE = "/api/expert/session";

const ACCOUNT_DISABLED_STORAGE_KEY = "coinzy_expert_account_disabled";

const EXPERT_LOGIN_PATH = "/expert/login";
const ACCOUNT_DISABLED_QUERY = "account=disabled";

const GENERIC_ERROR_MESSAGE =
  "Something went wrong. Please try again later.";

export type ApiEnvelope<T> = {
  error: boolean;
  message: string;
  data: T;
};

export type ApiClientResult<T> = {
  status: number;
  envelope: ApiEnvelope<T>;
};

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  /** Skip 401/403 redirects — use for login and other unauthenticated calls. */
  skipAuthHandling?: boolean;
};

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return BROWSER_API_PREFIX;
  }

  const base =
    import.meta.env.VITE_EXPERT_API_BASE_URL ??
    import.meta.env.VITE_EXPERT_SOCKET_URL ??
    "";
  return base.replace(/\/$/, "");
}

function buildUrl(
  path: string,
  params?: RequestOptions["params"],
): string {
  const base = getBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = path.startsWith("http")
    ? new URL(path)
    : new URL(
        base ? `${base}${normalizedPath}` : normalizedPath,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost",
      );

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export async function hasExpertSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const response = await fetch(SESSION_ROUTE, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) return false;

    const payload = (await response.json()) as { authenticated?: boolean };
    return payload.authenticated === true;
  } catch {
    return false;
  }
}

export async function setExpertToken(token: string): Promise<void> {
  if (typeof window === "undefined") return;

  const response = await fetch(SESSION_ROUTE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error("Unable to persist expert session.");
  }
}

export async function clearExpertToken(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await fetch(SESSION_ROUTE, {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    // Best-effort clear when logging out or handling auth errors.
  }
}

export function isExpertAccountDisabled(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ACCOUNT_DISABLED_STORAGE_KEY) === "1";
}

export function clearExpertAccountDisabled(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACCOUNT_DISABLED_STORAGE_KEY);
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  clearExpertAccountDisabled();
  window.location.assign(EXPERT_LOGIN_PATH);
}

function showAccountDisabledState(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACCOUNT_DISABLED_STORAGE_KEY, "1");
  window.dispatchEvent(new CustomEvent("expert:account-disabled"));
  window.location.assign(`${EXPERT_LOGIN_PATH}?${ACCOUNT_DISABLED_QUERY}`);
}

export async function expertForceLogout(
  reason: "unauthorized" | "inactive" = "unauthorized",
): Promise<void> {
  await clearExpertToken();
  if (reason === "inactive") {
    showAccountDisabledState();
    return;
  }
  redirectToLogin();
}

function applyRequestHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...headers,
  };
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    "message" in value &&
    "data" in value
  );
}

function normalizeEnvelope<T>(
  payload: unknown,
  fallbackMessage: string,
): ApiEnvelope<T> {
  if (isApiEnvelope(payload)) {
    return payload as ApiEnvelope<T>;
  }

  return {
    error: true,
    message: fallbackMessage,
    data: null as T,
  };
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function handleAuthAndStatus<T>(
  response: Response,
  envelope: ApiEnvelope<T>,
  skipAuthHandling = false,
): Promise<ApiEnvelope<T>> {
  if (skipAuthHandling) {
    if (response.status >= 500) {
      return {
        error: true,
        message: GENERIC_ERROR_MESSAGE,
        data: null as T,
      };
    }

    return envelope;
  }

  if (response.status === 401) {
    await clearExpertToken();
    redirectToLogin();
    return {
      error: true,
      message: envelope.message || "Session expired. Please sign in again.",
      data: null as T,
    };
  }

  if (
    response.status === 403 &&
    envelope.message === "Expert account is not active"
  ) {
    await clearExpertToken();
    showAccountDisabledState();
    return envelope;
  }

  if (response.status >= 500) {
    return {
      error: true,
      message: GENERIC_ERROR_MESSAGE,
      data: null as T,
    };
  }

  return envelope;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiClientResult<T>> {
  const {
    method = "GET",
    body,
    headers = {},
    params,
    signal,
    skipAuthHandling = false,
  } = options;

  let response: Response;

  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers: applyRequestHeaders(headers),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal,
    });
  } catch {
    return {
      status: 0,
      envelope: {
        error: true,
        message: GENERIC_ERROR_MESSAGE,
        data: null as T,
      },
    };
  }

  const payload = await readResponseBody(response);
  const envelope = await handleAuthAndStatus(
    response,
    normalizeEnvelope<T>(
      payload,
      response.status >= 500
        ? GENERIC_ERROR_MESSAGE
        : "Unexpected response from server.",
    ),
    skipAuthHandling,
  );

  return { status: response.status, envelope };
}

export const apiClient = {
  get<T>(path: string, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "GET" });
  },

  post<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) {
    return request<T>(path, { ...options, method: "POST", body });
  },

  put<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) {
    return request<T>(path, { ...options, method: "PUT", body });
  },

  patch<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) {
    return request<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T>(path: string, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};
