import { STORAGE_KEYS } from "@/config/appEnv";
import type { ExpertProfile } from "@/lib/expert/types";
import { normalizeExpertProfile } from "@/lib/expert/profileService";

const EXPERT_PROFILE_STORAGE_KEY = STORAGE_KEYS.profile;

let memoryProfile: ExpertProfile | null = null;

export function getStoredExpertProfile(): ExpertProfile | null {
  if (memoryProfile) return memoryProfile;

  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(EXPERT_PROFILE_STORAGE_KEY);
  if (!raw) return null;

  try {
    memoryProfile = normalizeExpertProfile(JSON.parse(raw) as ExpertProfile);
    return memoryProfile;
  } catch {
    sessionStorage.removeItem(EXPERT_PROFILE_STORAGE_KEY);
    return null;
  }
}

export function setStoredExpertProfile(
  profile: ExpertProfile,
  options?: { persist?: boolean },
): void {
  memoryProfile = normalizeExpertProfile(profile);

  if (typeof window === "undefined") return;

  if (options?.persist !== false) {
    sessionStorage.setItem(
      EXPERT_PROFILE_STORAGE_KEY,
      JSON.stringify(memoryProfile),
    );
  }
}

export function clearStoredExpertProfile(): void {
  memoryProfile = null;

  if (typeof window === "undefined") return;
  sessionStorage.removeItem(EXPERT_PROFILE_STORAGE_KEY);
}
