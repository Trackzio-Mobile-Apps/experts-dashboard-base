import { describe, expect, it } from "vitest";
import {
  buildExpertFullName,
  mapExpertApiToProfile,
  mapYearsOfExperience,
  mapYearsOfXpLabel,
  normalizeExpertProfile,
} from "@/lib/expert/profileService";
import type { BackendExpert, ExpertProfile } from "@/lib/expert/types";

function baseProfile(
  overrides: Partial<ExpertProfile> = {},
): ExpertProfile {
  return {
    id: "exp1",
    email: "a@b.com",
    firstName: "Ada",
    lastName: "Lovelace",
    name: "Ada Lovelace",
    isInternal: false,
    status: "active",
    supportedCountries: ["IN"],
    isAvailableForRequests: true,
    activeCommittedRequestCount: 2,
    lastAssignedAt: "2026-08-01T00:00:00.000Z",
    lastOfferedAt: "2026-08-02T00:00:00.000Z",
    profilePicture: null,
    oneLineDescription: "Coin expert",
    expertise: ["Ancient Coins"],
    yearsOfExperience: 12,
    yearsOfXp: "12 years",
    stats: {
      activeCases: 2,
      newRequests: 0,
      completed: 6,
      totalEarningsInr: 0,
      missedDeadlineCount: 1,
      avgCompletionHours: 4.5,
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("mapYearsOfXp from live /experts/me", () => {
  it("reads yearsOfXp display string like \"25 years\"", () => {
    expect(mapYearsOfXpLabel("25 years")).toBe("25 years");
    expect(mapYearsOfExperience("25 years")).toBe(25);
  });

  it("maps limba-style API expert payload", () => {
    const expert = {
      _id: "6a7988e8ffcbfa84984e1001",
      name: "Bharat Limba",
      email: "limba@trackzio.com",
      isInternal: false,
      isAvailableForRequests: true,
      supportedCountries: [],
      status: "active",
      activeCommittedRequestCount: 0,
      stats: {
        completedCount: 0,
        missedDeadlineCount: 0,
        avgCompletionHoursLast5: null,
      },
      lastAssignedAt: null,
      lastOfferedAt: null,
      profilePicture: null,
      oneLineDescription:
        "Modern Coins, Gold/Silver Coins, Mugal coins, princely state coins",
      expertise: "british india coins",
      yearsOfXp: "25 years",
      createdAt: "2026-08-10T08:16:40.553Z",
      updatedAt: "2026-08-10T14:21:59.016Z",
    } as BackendExpert;

    const profile = mapExpertApiToProfile(expert);
    expect(profile.yearsOfXp).toBe("25 years");
    expect(profile.yearsOfExperience).toBe(25);
    expect(profile.expertise).toEqual(["british india coins"]);
  });
});

describe("normalizeExpertProfile", () => {
  it("backfills missing newer API fields from a cached profile", () => {
    const stale = {
      id: "exp1",
      email: "a@b.com",
      firstName: "Ada",
      lastName: "Lovelace",
      isInternal: true,
      status: "active",
      supportedCountries: [],
      isAvailableForRequests: false,
      activeCommittedRequestCount: 0,
      lastAssignedAt: null,
      profilePicture: null,
      oneLineDescription: null,
      stats: {
        activeCases: 0,
        newRequests: 0,
        completed: 3,
        totalEarningsInr: 0,
        missedDeadlineCount: 0,
        avgCompletionHours: null,
      },
    } as unknown as ExpertProfile;

    const next = normalizeExpertProfile(stale);
    expect(next.name).toBe("Ada Lovelace");
    expect(next.expertise).toEqual([]);
    expect(next.yearsOfExperience).toBeNull();
    expect(next.yearsOfXp).toBeNull();
    expect(next.lastOfferedAt).toBeNull();
    expect(next.isInternal).toBe(true);
  });

  it("preserves mapped API values", () => {
    const next = normalizeExpertProfile(baseProfile());
    expect(next.expertise).toEqual(["Ancient Coins"]);
    expect(next.yearsOfExperience).toBe(12);
    expect(next.yearsOfXp).toBe("12 years");
    expect(next.lastOfferedAt).toBe("2026-08-02T00:00:00.000Z");
  });
});

describe("buildExpertFullName", () => {
  it("joins first and last name", () => {
    expect(buildExpertFullName("Ada", "Lovelace")).toBe("Ada Lovelace");
  });
});
