import {
  apiClient,
  clearExpertToken,
  setExpertToken,
} from "@/lib/expert/apiClient";
import {
  clearStoredExpertProfile,
  setStoredExpertProfile,
} from "@/lib/expert/expertSession";
import { disconnectExpertSocket } from "@/lib/expert/socket/expertSocketService";
import { getMyProfile } from "@/lib/expert/profileService";
import type {
  ExpertLoginApiData,
  ExpertLoginResult,
  ExpertProfile,
} from "@/lib/expert/types";

export class ExpertLoginError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ExpertLoginError";
  }
}

export async function clearExpertSession(): Promise<void> {
  disconnectExpertSocket();
  await clearExpertToken();
  clearStoredExpertProfile();
}

/** @deprecated Use `getMyProfile` from `@/lib/expert/profileService`. */
export async function fetchCurrentExpert(options?: {
  skipAuthHandling?: boolean;
}): Promise<ExpertProfile> {
  void options;
  return getMyProfile();
}

/**
 * Authenticate an expert. Profile fields always come from `GET /experts/me`
 * via `getMyProfile()` — not from the login response body.
 */
export async function login(
  email: string,
  password: string,
): Promise<ExpertLoginResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  await clearExpertToken();

  const { status, envelope } = await apiClient.post<ExpertLoginApiData>(
    "/experts/login",
    { email: normalizedEmail, password: normalizedPassword },
    { skipAuthHandling: true },
  );

  if (status === 400) {
    throw new ExpertLoginError(
      envelope.message || "Please check your email and password.",
      400,
    );
  }

  if (status === 401) {
    throw new ExpertLoginError(
      envelope.message || "Invalid expert email or password",
      401,
    );
  }

  if (status === 403) {
    throw new ExpertLoginError("Expert account is not active", 403);
  }

  if (envelope.error || !envelope.data?.token) {
    throw new ExpertLoginError(
      envelope.message || "Login failed. Please try again.",
      status,
    );
  }

  const { token } = envelope.data;
  await setExpertToken(token);

  const expert = await getMyProfile();
  setStoredExpertProfile(expert);

  return { token, expert };
}

// Re-export for callers that read cached profile outside React context.
export {
  getStoredExpertProfile as getStoredExpert,
  setStoredExpertProfile as setStoredExpert,
  clearStoredExpertProfile as clearStoredExpert,
} from "@/lib/expert/expertSession";
