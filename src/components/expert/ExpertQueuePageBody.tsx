import { Link } from "@/lib/router";
import { queueRowGridClass } from "@/components/expert/layout/panelLayout";
import type { QueueListItem } from "@/lib/expert/types";
import { QUEUE_PAGE_SIZE } from "@/lib/expert/constants";
import {
  formatQueueDeadlineLabel,
  formatQueueRequestIdLabel,
  resolveDeadlineExpired,
} from "@/lib/expert/format";
import {
  getQueueRowStyles,
  queuePrimaryButtonClass,
} from "@/lib/expert/queueRowStyles";
import { useDeadlineClock } from "@/lib/expert/useDeadlineClock";
import { ExpertEmptyState } from "@/components/expert/ExpertEmptyState";
import { ExpertScrollIllustration } from "@/components/expert/ExpertScrollIllustration";
import { ExpertQueueListSkeleton } from "@/components/expert/ExpertSkeleton";
import { QueueCoinPreview } from "@/components/expert/QueueCoinPreview";
import { ExpertPagination } from "@/components/expert/ExpertPagination";

type ExpertQueuePageBodyProps = {
  items: QueueListItem[];
  page: number;
  totalItems: number;
  isLoading?: boolean;
  skippingOfferId?: string | null;
  onSkipOffer?: (offerId: string, requestId: string) => void | Promise<void>;
};

const reassignButtonClass =
  "inline-flex h-10 min-w-[6.5rem] items-center justify-center rounded-lg border border-border bg-surface px-5 text-center text-sm font-semibold text-text transition-colors hover:bg-input-bg disabled:cursor-not-allowed disabled:opacity-50";

const actionRowClass = "flex flex-wrap items-center justify-end gap-3";

const queueStatusBadgeClass =
  "inline-flex h-7 w-fit shrink-0 items-center rounded-md px-3 text-sm font-medium";

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function ExpertQueuePageBody({
  items,
  page,
  totalItems,
  isLoading = false,
  skippingOfferId = null,
  onSkipOffer,
}: ExpertQueuePageBodyProps) {
  const nowMs = useDeadlineClock();
  const showEmpty = !isLoading && totalItems === 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / QUEUE_PAGE_SIZE));
  const from = totalItems === 0 ? 0 : (page - 1) * QUEUE_PAGE_SIZE + 1;
  const to = Math.min(page * QUEUE_PAGE_SIZE, totalItems);

  return (
    <div>
      <div className="mb-4 xl:mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-text xl:text-3xl">
          Evaluation queue
        </h2>
        <p className="mt-1 text-xs text-text-muted xl:text-base">
          All pending evaluation requests
        </p>
      </div>

      <div
        className={`rounded-xl border border-border/70 bg-surface shadow-sm xl:rounded-2xl ${
          showEmpty ? "p-0" : "p-5 sm:p-6"
        }`}
      >
        {isLoading ? (
          <ExpertQueueListSkeleton />
        ) : showEmpty ? (
          <ExpertEmptyState
            icon={<ExpertScrollIllustration />}
            title="Your queue is empty"
            description="This page will show all your new and in progress requests"
          />
        ) : (
          <>
            <ul className="space-y-4">
              {items.map((row) => {
                const deadlineExpired = resolveDeadlineExpired(
                  row.deadlineAt,
                  row.deadlineExpired,
                  nowMs,
                );
                const styles = getQueueRowStyles({ ...row, deadlineExpired, nowMs });

                return (
                  <li key={row.id}>
                    <article
                      className={`overflow-hidden rounded-xl border border-border/80 bg-surface py-4 pr-4 shadow-sm sm:pr-5 border-l-[6px] pl-4 sm:pl-5 ${styles.accent}`}
                    >
                      <div className={queueRowGridClass}>
                        <QueueCoinPreview
                          coinName={row.coinName}
                          thumbnailUrls={row.thumbnailUrls}
                        />

                        <div className="flex min-w-0 flex-col">
                          <p className="flex min-w-0 items-center gap-0.5 text-sm text-text-muted">
                            <ClockIcon className="shrink-0 text-text-muted/80" />
                            {row.submittedDisplay}
                          </p>

                          <p className="mt-2 text-base font-bold tracking-tight text-text">
                            {formatQueueRequestIdLabel(row.displayId)}
                          </p>

                          <span
                            className={`mt-3 w-fit ${queueStatusBadgeClass} ${styles.badge}`}
                          >
                            {styles.badgeLabel}
                          </span>
                        </div>

                        <div className="flex flex-col items-start sm:col-span-2 lg:col-span-1 lg:items-end">
                          <p className="flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted lg:justify-end">
                            <ClockIcon className="shrink-0 text-text-muted/80" />
                            Deadline
                          </p>
                          <p
                            className={`mt-0.5 text-lg font-bold tabular-nums ${styles.deadlineClass}`}
                          >
                            {formatQueueDeadlineLabel(
                              row.deadlineAt,
                              row.deadlineDays,
                              nowMs,
                            )}
                          </p>

                          {row.variant === "pending_review" ? (
                            <div className={`mt-3 ${actionRowClass}`}>
                              <button
                                type="button"
                                disabled={
                                  !row.offerId ||
                                  !onSkipOffer ||
                                  skippingOfferId === row.offerId
                                }
                                title="Decline this offer and return it to the pool"
                                onClick={() =>
                                  void onSkipOffer?.(
                                    row.offerId ?? "",
                                    row.id,
                                  )
                                }
                                className={reassignButtonClass}
                              >
                                {skippingOfferId === row.offerId
                                  ? "Skipping…"
                                  : "Skip"}
                              </button>
                              <Link
                                href={`/expert/queue/${row.id}?offerId=${encodeURIComponent(row.offerId ?? "")}`}
                                className={`${queuePrimaryButtonClass} ${styles.primaryButton}`}
                              >
                                View Request
                              </Link>
                            </div>
                          ) : (
                            <div className={`mt-3 ${actionRowClass}`}>
                              <Link
                                href={`/expert/queue/${row.id}`}
                                className={`${queuePrimaryButtonClass} ${styles.primaryButton}`}
                              >
                                Continue
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>

            <footer className="mt-8 flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-text-muted">
                Showing {from} to {to} of {totalItems} requests
              </p>
              <ExpertPagination
                page={page}
                totalPages={totalPages}
                ariaLabel="Queue pagination"
                getPageHref={(p) => `/expert/queue?page=${p}`}
              />
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
