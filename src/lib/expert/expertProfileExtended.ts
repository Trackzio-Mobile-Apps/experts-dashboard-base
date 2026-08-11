import type { BackendExpertReview } from "@/lib/expert/types";

export type ExpertEarningsSummary = {
  totalInr: number;
  pendingInr: number;
  pendingReviewCount: number;
  thisMonthInr: number;
  thisMonthCompleted: number;
  memberSinceLabel: string;
};

export type ExpertExtendedProfile = {
  tagline: string;
  age: string;
  country: string;
  professionalBio: string;
  summaryTags: string[];
  expertiseCategories: string[];
  earnings: ExpertEarningsSummary;
};

export type ExpertReview = {
  id: string;
  reviewerName: string;
  dateLabel: string;
  requestId: string;
  displayId: string;
  coinName: string;
  rating: number;
  sentiment: string;
  comment: string;
  platform: string;
};

export type ExpertReviewsResult = {
  expertId: string;
  average: number | null;
  count: number;
  reviews: ExpertReview[];
};

const STORAGE_PREFIX = "coinzy_expert_extended_profile_";

export const EXPERTISE_OPTIONS = [
  "Ancient Coins",
  "Indian Pottery",
  "British India",
  "Mughal Empire",
  "Colonial Era",
  "Artefacts",
] as const;

function defaultExtendedProfile(): ExpertExtendedProfile {
  return {
    tagline: "",
    age: "",
    country: "",
    professionalBio: "",
    summaryTags: [],
    expertiseCategories: [],
    earnings: {
      totalInr: 0,
      pendingInr: 0,
      pendingReviewCount: 0,
      thisMonthInr: 0,
      thisMonthCompleted: 0,
      memberSinceLabel: "",
    },
  };
}

export function loadExtendedProfile(expertId: string): ExpertExtendedProfile {
  if (typeof window === "undefined") return defaultExtendedProfile();

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${expertId}`);
    if (!raw) return defaultExtendedProfile();
    const parsed = JSON.parse(raw) as Partial<ExpertExtendedProfile>;
    const defaults = defaultExtendedProfile();
    return {
      ...defaults,
      ...parsed,
      summaryTags: Array.isArray(parsed.summaryTags)
        ? parsed.summaryTags
        : defaults.summaryTags,
      expertiseCategories: Array.isArray(parsed.expertiseCategories)
        ? parsed.expertiseCategories
        : defaults.expertiseCategories,
      earnings: {
        ...defaults.earnings,
        ...parsed.earnings,
      },
    };
  } catch {
    return defaultExtendedProfile();
  }
}

export function saveExtendedProfile(
  expertId: string,
  profile: ExpertExtendedProfile,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${expertId}`, JSON.stringify(profile));
}

function formatReviewDate(isoDate: unknown): string {
  if (!isoDate || typeof isoDate !== "string") return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function mapBackendReviewsToExpertReviews(
  reviews: BackendExpertReview[],
): ExpertReview[] {
  return reviews.map((review) => ({
    id: review._id,
    reviewerName: review.reviewerDisplayName?.trim() || "Anonymous",
    dateLabel: formatReviewDate(review.ratedAt || review.createdAt),
    requestId: review.requestId,
    displayId: review.displayId?.trim() || "",
    coinName: review.coinName?.trim() || "—",
    rating: review.rating,
    sentiment: review.sentiment?.trim() || "",
    comment: review.comment?.trim() || "",
    platform: review.platform?.trim() || "",
  }));
}

export function getReviewSummary(
  reviews: ExpertReview[],
  apiSummary?: { average: number | null; count: number },
) {
  if (apiSummary) {
    return {
      average: apiSummary.average ?? 0,
      count: apiSummary.count,
      hasAverage: apiSummary.average != null,
    };
  }

  if (reviews.length === 0) {
    return { average: 0, count: 0, hasAverage: false };
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
    hasAverage: true,
  };
}
