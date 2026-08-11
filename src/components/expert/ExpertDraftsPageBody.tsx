import { Link } from "@/lib/router";
import type { DraftListItem } from "@/lib/expert/types";
import {
  formatQueueDeadlineLabel,
  formatQueueRequestIdLabel,
} from "@/lib/expert/format";
import {
  DRAFT_ROW_STYLES,
  draftContinueButtonClass,
} from "@/lib/expert/queueRowStyles";
import { useDeadlineClock } from "@/lib/expert/useDeadlineClock";
import { ExpertEmptyState } from "@/components/expert/ExpertEmptyState";
import { ExpertScrollIllustration } from "@/components/expert/ExpertScrollIllustration";
import { ExpertDraftsListSkeleton } from "@/components/expert/ExpertSkeleton";

type ExpertDraftsPageBodyProps = {
  items: DraftListItem[];
  isLoading?: boolean;
};

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

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function ExpertDraftsPageBody({
  items,
  isLoading = false,
}: ExpertDraftsPageBodyProps) {
  const nowMs = useDeadlineClock();
  // items already come from the canonical draftsList (badge uses the same list).
  const showEmpty = !isLoading && items.length === 0;
  const count = items.length;

  return (
    <div>
      <div className="mb-5 xl:mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-text xl:text-3xl">
          Drafts
        </h2>
        <p className="mt-1 text-sm text-text-muted xl:text-base">
          Evaluations you&apos;ve started but not yet submitted.
        </p>
      </div>

      <div
        className={`rounded-2xl border border-border/70 bg-surface shadow-sm ${
          showEmpty || isLoading ? "p-0" : "p-5 sm:p-6 xl:p-8"
        }`}
      >
        {isLoading ? (
          <div className="p-5 sm:p-6 xl:p-8">
            <ExpertDraftsListSkeleton />
          </div>
        ) : showEmpty ? (
          <ExpertEmptyState
            icon={<ExpertScrollIllustration />}
            title="Drafts Page"
            description="This page will show incompleted evaluations"
          />
        ) : (
          <>
            <div className="mb-5 flex items-start gap-3 rounded-r-lg border-l-4 border-expert-action-green bg-expert-draft-banner px-4 py-3.5 text-sm leading-relaxed text-expert-draft-banner-text">
              <PencilIcon className="mt-0.5 shrink-0 text-expert-action-green" />
              <p>
                Drafts auto-save every 2 minutes. Your progress is never lost.
              </p>
            </div>

            <p className="mb-5 text-sm text-text-muted">
              {count} {count === 1 ? "draft" : "drafts"} in progress
            </p>

            <ul className="space-y-5">
              {items.map((row) => (
                <DraftRow key={row.id} row={row} nowMs={nowMs} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function DraftRow({ row, nowMs }: { row: DraftListItem; nowMs: number }) {
  return (
    <li>
      <article
        className={`rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6 border-l-4 sm:pl-5 ${DRAFT_ROW_STYLES.accent}`}
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:grid-rows-[auto_auto_auto] sm:gap-y-4">
          <p className="flex items-center gap-1.5 text-sm text-text-muted sm:row-start-1">
            <ClockIcon className="shrink-0 text-text-muted/80" />
            <span className="truncate">{row.submittedDisplay}</span>
          </p>

          <div className="grid grid-cols-[auto_auto] items-start gap-x-4 gap-y-1 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end sm:gap-x-5">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${DRAFT_ROW_STYLES.badge}`}
            >
              Draft
            </span>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                <ClockIcon className="shrink-0 text-text-muted/80" />
                Deadline
              </p>
            </div>
            <div aria-hidden className="hidden sm:block" />
            <p className="text-right text-lg font-bold tabular-nums text-text">
              {formatQueueDeadlineLabel(
                row.deadlineAt,
                row.deadlineDays,
                nowMs,
              )}
            </p>
          </div>

          <p className="text-xl font-bold tracking-tight text-text sm:row-start-2">
            {formatQueueRequestIdLabel(row.displayId)}
          </p>

          <div className="sm:col-start-1 sm:row-start-3">
            <p className="text-xs font-medium text-text-muted">Form progress</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-input-bg">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${row.progressPercent}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-text">
                {row.progressPercent}% complete
              </span>
            </div>
          </div>

          <div className="flex justify-start sm:col-start-2 sm:row-start-3 sm:items-end sm:justify-end">
            <Link
              href={`/expert/queue/${row.id}`}
              className={`${draftContinueButtonClass} ${DRAFT_ROW_STYLES.continueButton}`}
            >
              Continue
            </Link>
          </div>
        </div>
      </article>
    </li>
  );
}
