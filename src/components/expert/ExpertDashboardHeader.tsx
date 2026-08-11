import type { ExpertDashboardStats } from "@/lib/expert/types";
import {
  ExpertStatCardsSkeleton,
  SkeletonBone,
} from "@/components/expert/ExpertSkeleton";
import { ExpertStatCard } from "@/components/expert/ExpertStatCard";

type ExpertDashboardHeaderProps = {
  greeting: string;
  stats: ExpertDashboardStats;
  isLoading?: boolean;
};

export function ExpertDashboardHeader({
  greeting,
  stats,
  isLoading = false,
}: ExpertDashboardHeaderProps) {
  const s = stats;

  return (
    <header className="bg-expert-dashboard-canvas pb-6 pt-1 xl:pb-8">
      <div className="mb-3 xl:mb-4">
        {isLoading ? (
          <>
            <SkeletonBone className="h-7 w-56" />
            <SkeletonBone className="mt-2 h-4 w-72" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-[1.7rem] xl:text-4xl">
              {greeting}
            </h1>
            <p className="mt-1 text-xs text-text-muted xl:text-base">
              Here&apos;s your evaluation activity at a glance
            </p>
          </>
        )}
      </div>

      {isLoading ? (
        <ExpertStatCardsSkeleton count={3} columns={3} compact />
      ) : (
        <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap">
          <ExpertStatCard
            highlighted
            href="/expert/drafts"
            label="Active cases"
            value={s.activeCases}
            hint="Pending your review"
          />
          <ExpertStatCard
            href="/expert/queue"
            label="New requests"
            value={s.newRequests}
            hint="This month"
          />
          <ExpertStatCard
            href="/expert/history"
            label="Completed"
            value={s.completed}
            hint="All time"
          />
        </div>
      )}
    </header>
  );
}
