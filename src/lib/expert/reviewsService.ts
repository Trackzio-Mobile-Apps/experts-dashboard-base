import { apiClient } from "@/lib/expert/apiClient";
import {
  mapBackendReviewsToExpertReviews,
  type ExpertReviewsResult,
} from "@/lib/expert/expertProfileExtended";
import type { ExpertReviewsApiData } from "@/lib/expert/types";

export class ExpertReviewsError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ExpertReviewsError";
  }
}

/**
 * Load feedback submitted against the authenticated expert's completed reports.
 * `GET /experts/me/reviews`
 */
export async function getExpertReviews(): Promise<ExpertReviewsResult> {
  const { status, envelope } = await apiClient.get<ExpertReviewsApiData>(
    "/experts/me/reviews",
    { skipAuthHandling: true },
  );

  console.log("[expert] GET /experts/me/reviews response", {
    status,
    error: envelope.error,
    message: envelope.message,
    data: envelope.data,
    reviewCount: envelope.data?.reviews?.length ?? 0,
    average: envelope.data?.average ?? null,
    count: envelope.data?.count ?? 0,
  });

  if (status === 401) {
    throw new ExpertReviewsError(
      envelope.message || "Session expired.",
      401,
    );
  }

  if (envelope.error || !envelope.data) {
    throw new ExpertReviewsError(
      envelope.message || "Unable to load reviews.",
      status,
    );
  }

  const { expertId, average, count, reviews } = envelope.data;

  return {
    expertId,
    average: average ?? null,
    count: count ?? 0,
    reviews: mapBackendReviewsToExpertReviews(reviews ?? []),
  };
}
