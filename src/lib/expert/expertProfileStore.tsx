"use client";

import {
  clearExpertToken,
  expertForceLogout,
  hasExpertSession,
} from "@/lib/expert/apiClient";
import {
  clearStoredExpertProfile,
  getStoredExpertProfile,
  setStoredExpertProfile,
} from "@/lib/expert/expertSession";
import {
  ExpertProfileError,
  getMyProfile,
} from "@/lib/expert/profileService";
import type { ExpertProfile } from "@/lib/expert/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ExpertProfileState = {
  profile: ExpertProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  accountInactive: boolean;
  error: string | null;
};

type ExpertProfileContextValue = ExpertProfileState & {
  /** Hydrate store from a profile object (e.g. after `getMyProfile`). */
  hydrateProfile: (profile: ExpertProfile) => void;
  /** Fetch `/experts/me` and update global state. */
  refreshProfile: (options?: { silent?: boolean }) => Promise<ExpertProfile | null>;
  /** On app load: fetch profile when a token exists. */
  initialize: () => Promise<void>;
  clearProfile: () => void;
};

const ExpertProfileContext = createContext<ExpertProfileContextValue | null>(
  null,
);

function clearExpertAuthSession(): void {
  void clearExpertToken();
  clearStoredExpertProfile();
}

export function ExpertProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ExpertProfile | null>(() =>
    getStoredExpertProfile(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [accountInactive, setAccountInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearProfile = useCallback(() => {
    clearExpertAuthSession();
    setProfile(null);
    setError(null);
    setAccountInactive(false);
  }, []);

  const hydrateProfile = useCallback((next: ExpertProfile) => {
    setStoredExpertProfile(next);
    setProfile(next);
    setError(null);
    setAccountInactive(false);
  }, []);

  const handleProfileError = useCallback(
    (err: unknown) => {
      if (err instanceof ExpertProfileError) {
        if (err.code === "unauthorized") {
          clearProfile();
          void expertForceLogout("unauthorized");
          return null;
        }

        if (err.code === "inactive") {
          clearProfile();
          setAccountInactive(true);
          void expertForceLogout("inactive");
          return null;
        }

        setError(err.message);
        return null;
      }

      setError("Unable to load expert profile.");
      return null;
    },
    [clearProfile],
  );

  const refreshProfile = useCallback(async (options?: { silent?: boolean }) => {
    if (!(await hasExpertSession())) {
      clearProfile();
      return null;
    }

    const silent = Boolean(options?.silent);
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const next = await getMyProfile();
      hydrateProfile(next);
      return next;
    } catch (err) {
      return handleProfileError(err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [clearProfile, handleProfileError, hydrateProfile]);

  const initialize = useCallback(async () => {
    if (!(await hasExpertSession())) {
      clearProfile();
      setIsInitialized(true);
      return;
    }

    setIsLoading(true);
    try {
      const next = await getMyProfile();
      hydrateProfile(next);
    } catch (err) {
      handleProfileError(err);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [clearProfile, handleProfileError, hydrateProfile]);

  const value = useMemo<ExpertProfileContextValue>(
    () => ({
      profile,
      isLoading,
      isInitialized,
      accountInactive,
      error,
      hydrateProfile,
      refreshProfile,
      initialize,
      clearProfile,
    }),
    [
      profile,
      isLoading,
      isInitialized,
      accountInactive,
      error,
      hydrateProfile,
      refreshProfile,
      initialize,
      clearProfile,
    ],
  );

  return (
    <ExpertProfileContext.Provider value={value}>
      {children}
    </ExpertProfileContext.Provider>
  );
}

export function useExpertProfile(): ExpertProfileContextValue {
  const ctx = useContext(ExpertProfileContext);
  if (!ctx) {
    throw new Error("useExpertProfile must be used within ExpertProfileProvider");
  }
  return ctx;
}
