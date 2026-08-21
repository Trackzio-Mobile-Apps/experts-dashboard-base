import { ExpertAvatar } from "@/components/expert/ExpertAvatar";
import { ExpertEmptyState } from "@/components/expert/ExpertEmptyState";
import { ExpertProfileSkeleton } from "@/components/expert/ExpertSkeleton";
import {
  getCountries,
  resolveCountryLabel,
  type Country,
} from "@/lib/expert/countriesService";
import {
  getReviewSummary,
  type ExpertReview,
} from "@/lib/expert/expertProfileExtended";
import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import {
  formatAvgTurnaround,
  formatQueueRequestIdLabel,
  formatShortDate,
} from "@/lib/expert/format";
import { getExpertReviews } from "@/lib/expert/reviewsService";
import type { ExpertProfile } from "@/lib/expert/types";
import { useEffect, useState, type ReactNode } from "react";

function profileInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase() || "?";
}

function formatSupportedCountries(
  codes: string[],
  countries: Country[],
): string {
  if (codes.length === 0) return "All countries";
  return codes
    .map((code) => resolveCountryLabel(code, countries))
    .join(", ");
}

function formatAverageRating(average: number, hasAverage: boolean): string {
  if (!hasAverage) return "—";
  return average.toFixed(1);
}

function formatOptionalDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  const label = formatShortDate(iso);
  return label === "—" ? "—" : label;
}

function formatAccountStatus(status: string): string {
  const trimmed = status.trim();
  if (!trimmed) return "—";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function ProfileField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-text">{children}</dd>
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(filled)}
      <span className="text-text-muted/40">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

function ExpertReviewCard({ review }: { review: ExpertReview }) {
  const requestLabel = review.displayId
    ? formatQueueRequestIdLabel(review.displayId)
    : "—";

  return (
    <article className="border-b border-border/60 py-5 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-semibold text-text">{review.reviewerName}</h3>
          <p className="text-xs text-text-muted">{review.dateLabel}</p>
        </div>
        <RatingStars rating={review.rating} />
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
            Request
          </dt>
          <dd className="mt-0.5 text-text">{requestLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
            Coin
          </dt>
          <dd className="mt-0.5 text-text">{review.coinName}</dd>
        </div>
        {review.sentiment ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
              Sentiment
            </dt>
            <dd className="mt-0.5 capitalize text-text">{review.sentiment}</dd>
          </div>
        ) : null}
        {review.platform ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
              Platform
            </dt>
            <dd className="mt-0.5 text-text">{review.platform}</dd>
          </div>
        ) : null}
      </dl>
      {review.comment ? (
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          &ldquo;{review.comment}&rdquo;
        </p>
      ) : null}
    </article>
  );
}

function profileAvailabilityLabel(profile: ExpertProfile): string {
  if (profile.status && profile.status !== "active") {
    return formatAccountStatus(profile.status);
  }
  return profile.isAvailableForRequests ? "Available" : "Unavailable";
}

export function ExpertProfileScreen() {
  const { profile, isLoading } = useExpertProfile();
  const [countries, setCountries] = useState<Country[]>([]);
  const [reviews, setReviews] = useState<ExpertReview[]>([]);
  const [reviewAverage, setReviewAverage] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const nextCountries = await getCountries();
        if (!cancelled) setCountries(nextCountries);
      } catch {
        // Country labels fall back to raw ISO codes.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;
    setReviewsLoading(true);
    setReviewsLoaded(false);

    void (async () => {
      try {
        const result = await getExpertReviews();
        if (cancelled) return;

        setReviews(result.reviews);
        setReviewAverage(result.average);
        setReviewCount(result.count);
        setReviewsLoaded(true);

        console.log("[expert] profile reviews loaded", {
          count: result.count,
          average: result.average,
          reviews: result.reviews,
          isEmpty: result.reviews.length === 0,
        });
      } catch (error) {
        if (cancelled) return;

        setReviews([]);
        setReviewAverage(null);
        setReviewCount(0);
        setReviewsLoaded(true);

        console.warn("[expert] GET /experts/me/reviews failed", error);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  const reviewSummary = getReviewSummary(reviews, {
    average: reviewAverage,
    count: reviewCount,
  });

  if (isLoading || !profile) {
    return <ExpertProfileSkeleton />;
  }

  const fullName =
    profile.name?.trim() ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const initials = profileInitials(profile.firstName, profile.lastName);
  const countryDisplay = formatSupportedCountries(
    profile.supportedCountries,
    countries,
  );
  const tagline = profile.oneLineDescription?.trim() ?? "";
  const expertiseDisplay =
    profile.expertise.length > 0 ? profile.expertise.join(", ") : "—";
  const yearsDisplay =
    profile.yearsOfXp?.trim() ||
    (profile.yearsOfExperience != null
      ? String(profile.yearsOfExperience)
      : "—");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          My profile
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Your account details from the expert portal
        </p>
      </header>

      <section className="rounded-2xl border border-border/70 bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <ExpertAvatar
            profilePicture={profile.profilePicture}
            initials={initials}
            name={fullName}
            size="md"
          />

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-text">
                {fullName || "—"}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-text-muted">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    profile.status && profile.status !== "active"
                      ? "bg-expert-status-inactive"
                      : profile.isAvailableForRequests
                        ? "bg-expert-status-active"
                        : "bg-expert-status-inactive"
                  }`}
                  aria-hidden
                />
                {profileAvailabilityLabel(profile)}
                {profile.isInternal ? (
                  <span className="ml-2 rounded-md bg-input-bg px-2 py-0.5 text-xs font-medium text-text-muted">
                    Internal
                  </span>
                ) : null}
              </p>
              {tagline ? (
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {tagline}
                </p>
              ) : null}
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <ProfileField label="Email">
                {profile.email || "—"}
              </ProfileField>
              <ProfileField label="Account status">
                {formatAccountStatus(String(profile.status || "active"))}
              </ProfileField>
              <ProfileField label="Expert type">
                {profile.isInternal ? "Internal" : "External"}
              </ProfileField>
              <ProfileField label="Availability">
                {profile.isAvailableForRequests
                  ? "Accepting new requests"
                  : "Not accepting new requests"}
              </ProfileField>
              <ProfileField label="Supported countries">
                {countryDisplay}
              </ProfileField>
              <ProfileField label="Expertise">{expertiseDisplay}</ProfileField>
              <ProfileField label="Years of experience">
                {yearsDisplay}
              </ProfileField>
              <ProfileField label="Active committed requests">
                {profile.activeCommittedRequestCount}
              </ProfileField>
              <ProfileField label="Completed evaluations">
                {profile.stats.completed}
              </ProfileField>
              <ProfileField label="Missed deadlines">
                {profile.stats.missedDeadlineCount}
              </ProfileField>
              <ProfileField label="Avg. turnaround">
                {formatAvgTurnaround(profile.stats.avgCompletionHours)}
              </ProfileField>
              <ProfileField label="Last assigned">
                {formatOptionalDate(profile.lastAssignedAt)}
              </ProfileField>
              <ProfileField label="Last offered">
                {formatOptionalDate(profile.lastOfferedAt)}
              </ProfileField>
              <ProfileField label="Member since">
                {formatOptionalDate(profile.createdAt)}
              </ProfileField>
              <ProfileField label="Profile updated">
                {formatOptionalDate(profile.updatedAt)}
              </ProfileField>
            </dl>
          </div>
        </div>
      </section>

      {reviewsLoading ? (
        <section className="rounded-2xl border border-border/70 bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-sm text-text-muted">Loading reviews…</p>
        </section>
      ) : reviews.length === 0 && reviewsLoaded ? (
        <section className="rounded-2xl border border-border/70 bg-surface shadow-sm">
          <ExpertEmptyState
            title="No Reviews Yet"
            description="Reviews from your completed evaluations will appear here."
          />
        </section>
      ) : reviews.length > 0 ? (
        <section className="rounded-2xl border border-border/70 bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text">
                Feedback &amp; reviews
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                What coin owners are saying about your evaluations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-text">
                {formatAverageRating(
                  reviewSummary.average,
                  reviewSummary.hasAverage,
                )}
              </span>
              <span className="text-sm text-text-muted">
                {reviewSummary.count}{" "}
                {reviewSummary.count === 1 ? "review" : "reviews"}
              </span>
            </div>
          </div>
          <div className="mt-2">
            {reviews.map((review) => (
              <ExpertReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
