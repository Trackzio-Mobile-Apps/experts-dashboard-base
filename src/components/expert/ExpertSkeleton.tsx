import {
  evaluationRequestScrollGridClass,
  panelSidebarClass,
  panelSidebarInnerClass,
} from "@/components/expert/layout/panelLayout";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SkeletonBone({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cx(
        "animate-pulse rounded-md bg-border/70",
        className,
      )}
      aria-hidden
    />
  );
}

export function ExpertStatCardsSkeleton({
  count = 4,
  columns = 4,
  compact = false,
}: {
  count?: number;
  columns?: 3 | 4;
  /** History summary cards — Figma 249×116 */
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex flex-col gap-6 sm:flex-row sm:flex-wrap"
          : columns === 3
            ? "grid grid-cols-1 gap-4 sm:grid-cols-3"
            : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      }
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={
            compact
              ? "flex h-[116px] w-full flex-col justify-between rounded-xl border border-border bg-surface px-5 py-4 shadow-sm sm:w-[249px] sm:shrink-0"
              : "min-h-28 rounded-xl border border-border/80 bg-surface px-5 py-4 shadow-sm xl:min-h-[9.5rem] xl:px-6 xl:py-5"
          }
        >
          <SkeletonBone className="h-3 w-24" />
          <SkeletonBone className={compact ? "h-8 w-16" : "mt-3 h-8 w-16"} />
          <SkeletonBone className={compact ? "h-3 w-28" : "mt-3 h-3 w-28"} />
        </div>
      ))}
    </div>
  );
}

export function ExpertQueueListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="mt-6 space-y-4" aria-busy="true" aria-label="Loading queue">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index}>
          <article className="flex flex-col gap-4 rounded-xl border border-border/80 border-l-4 border-l-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex min-w-0 flex-1 gap-4">
              <SkeletonBone className="h-14 w-[7.5rem] shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBone className="h-3 w-52" />
                <SkeletonBone className="h-5 w-28" />
                <SkeletonBone className="h-5 w-24 rounded-full" />
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <SkeletonBone className="h-10 w-28 rounded-lg" />
              <SkeletonBone className="h-10 w-28 rounded-lg" />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

export function ExpertDraftsListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="space-y-4" aria-busy="true" aria-label="Loading drafts">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index}>
          <article className="rounded-xl border border-border border-l-4 border-l-expert-draft-accent bg-surface p-5 shadow-sm sm:p-6 sm:pl-5">
            <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:grid-rows-[auto_auto_auto] sm:gap-y-4">
              <SkeletonBone className="h-3.5 w-44 sm:row-start-1" />
              <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end sm:gap-x-5">
                <SkeletonBone className="h-6 w-14 rounded-full" />
                <SkeletonBone className="h-3.5 w-20" />
                <div className="hidden sm:block" aria-hidden />
                <SkeletonBone className="h-7 w-16 justify-self-end" />
              </div>
              <SkeletonBone className="h-7 w-36 sm:row-start-2" />
              <div className="sm:col-start-1 sm:row-start-3">
                <SkeletonBone className="h-3 w-24" />
                <div className="mt-2 flex items-center gap-3">
                  <SkeletonBone className="h-2 min-w-0 flex-1 rounded-full" />
                  <SkeletonBone className="h-3 w-20 shrink-0" />
                </div>
              </div>
              <SkeletonBone className="h-10 w-[7.5rem] justify-self-start rounded-lg sm:col-start-2 sm:row-start-3 sm:justify-self-end" />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

export function ExpertHistoryTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="mt-8 rounded-2xl border border-border/70 bg-surface shadow-sm"
      aria-busy="true"
      aria-label="Loading history"
    >
      <div className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <SkeletonBone className="h-4 w-40" />
        <div className="flex gap-2">
          <SkeletonBone className="h-8 w-16 rounded-lg" />
          <SkeletonBone className="h-8 w-20 rounded-lg" />
          <SkeletonBone className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-input-bg/40">
              {Array.from({ length: 6 }, (_, index) => (
                <th key={index} className="px-4 py-3 sm:px-6">
                  <SkeletonBone className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, index) => (
              <tr key={index} className="border-b border-border/40">
                <td className="px-4 py-4 sm:px-6">
                  <SkeletonBone className="h-4 w-36" />
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <SkeletonBone className="h-4 w-20" />
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <SkeletonBone className="h-4 w-16" />
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <SkeletonBone className="h-4 w-20" />
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <SkeletonBone className="h-5 w-16 rounded-full" />
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <SkeletonBone className="h-8 w-20 rounded-lg" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ExpertProfileSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading profile">
      <div>
        <SkeletonBone className="h-7 w-36" />
        <SkeletonBone className="mt-2 h-4 w-64" />
      </div>

      <section className="rounded-2xl border border-border/70 bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <SkeletonBone className="h-20 w-20 rounded-full" />
          <div className="min-w-0 flex-1 space-y-4">
            <SkeletonBone className="h-6 w-48" />
            <SkeletonBone className="h-4 w-full max-w-lg" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <SkeletonBone className="h-3 w-24" />
                  <SkeletonBone className="h-4 w-40" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ExpertRequestDetailSkeleton() {
  return (
    <div
      className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-7 lg:p-8"
      aria-busy="true"
      aria-label="Loading request"
    >
      <div className="border-b border-border/60 pb-5">
        <SkeletonBone className="h-3 w-44" />
        <SkeletonBone className="mt-3 h-6 w-72 max-w-full" />
        <SkeletonBone className="mt-2 h-4 w-52" />
      </div>
      <div className={`mt-6 ${evaluationRequestScrollGridClass}`}>
        <div className="space-y-4">
          <SkeletonBone className="h-3 w-40" />
          <div className="flex flex-wrap gap-2.5">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonBone
                key={index}
                className="h-[4.75rem] w-[4.75rem] rounded-lg sm:h-[5.5rem] sm:w-[5.5rem]"
              />
            ))}
          </div>
          <SkeletonBone className="h-20 w-full rounded-xl" />
        </div>
        <SkeletonBone className="h-52 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function ExpertSessionSkeleton() {
  return (
    <div
      className="flex min-h-screen bg-expert-dashboard-canvas"
      aria-busy="true"
      aria-label="Loading session"
    >
      <aside className={panelSidebarClass}>
        <div className={panelSidebarInnerClass}>
        <SkeletonBone className="h-11 w-40 bg-white/15 xl:h-12 xl:w-44 2xl:h-14 2xl:w-48" />
        <div className="mt-10 space-y-3 xl:space-y-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBone key={index} className="h-10 w-full rounded-xl bg-white/10 xl:h-11 2xl:h-12" />
          ))}
        </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 items-start justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="w-full max-w-3xl space-y-4 rounded-2xl border border-border/70 bg-surface p-8 shadow-sm">
          <SkeletonBone className="h-4 w-40" />
          <SkeletonBone className="h-7 w-72 max-w-full" />
          <SkeletonBone className="h-4 w-52" />
          <div className="grid gap-4 pt-4 lg:grid-cols-2">
            <SkeletonBone className="h-40 w-full rounded-xl" />
            <SkeletonBone className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExpertReportModalSkeleton() {
  return (
    <div className="space-y-4 p-6" aria-busy="true" aria-label="Loading report">
      <SkeletonBone className="mx-auto h-6 w-48" />
      <SkeletonBone className="mx-auto h-4 w-32" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="space-y-2 rounded-lg border border-border/60 p-3">
            <SkeletonBone className="h-3 w-20" />
            <SkeletonBone className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
