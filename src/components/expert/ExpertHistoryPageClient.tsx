import { ExpertHistoryPageBody } from "@/components/expert/ExpertHistoryPageBody";
import { HISTORY_PAGE_SIZE } from "@/lib/expert/constants";
import {
  formatAvgTurnaround,
  normalizeMongoId,
  parseHistoryPeriod,
  parseHistoryReportParam,
  parseHistoryReportRequestParam,
} from "@/lib/expert/format";
import {
  filterHistoryByPeriod,
  mapRequestToHistoryRow,
} from "@/lib/expert/requestMappers";
import { extractReportIdFromRequest } from "@/lib/expert/reportsService";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import type { HistorySummaryStats } from "@/lib/expert/types";
import { useSearchParams } from "@/lib/router";
import { useMemo } from "react";

export function ExpertHistoryPageClient() {
  const searchParams = useSearchParams();
  const { requests, offers, isLoading, error } = useExpertPanelData();
  const { profile } = useExpertProfile();

  const period = parseHistoryPeriod(searchParams.get("period") ?? undefined);
  const activeReportId = parseHistoryReportParam(
    searchParams.get("report") ?? undefined,
  );
  const activeReportRequestId = parseHistoryReportRequestParam(
    searchParams.get("reportRequest") ?? undefined,
  );

  const allRows = useMemo(
    () =>
      requests
        .map((request) => {
          const requestId = normalizeMongoId(request._id);
          const matchedOffer = offers.find(
            (offer) => normalizeMongoId(offer.request._id) === requestId,
          );
          return mapRequestToHistoryRow(request, {
            reportId: extractReportIdFromRequest(request) ?? undefined,
            offerId: matchedOffer
              ? normalizeMongoId(matchedOffer._id)
              : undefined,
          });
        })
        .filter((row) => row.status !== "draft"),
    [requests, offers],
  );

  const filtered = useMemo(
    () => filterHistoryByPeriod(allRows, requests, period),
    [allRows, requests, period],
  );

  const rawPage = parseInt(String(searchParams.get("page") ?? "1"), 10);
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / HISTORY_PAGE_SIZE));
  const page = Number.isFinite(rawPage)
    ? Math.min(Math.max(1, rawPage), totalPages)
    : 1;

  const start = (page - 1) * HISTORY_PAGE_SIZE;
  const slice = filtered.slice(start, start + HISTORY_PAGE_SIZE);

  const summary = useMemo<HistorySummaryStats>(() => {
    const completed = requests.filter(
      (r) => r.status === "completed" || r.status === "report_submitted",
    ).length;
    const totalEarnedInr =
      profile?.stats.totalEarningsInr && profile.stats.totalEarningsInr > 0
        ? profile.stats.totalEarningsInr
        : null;
    return {
      totalCompleted: completed,
      avgTurnaround: formatAvgTurnaround(
        profile?.stats.avgCompletionHours ?? null,
      ),
      totalEarnedInr,
      earnedThisMonthInr: null,
    };
  }, [requests, profile]);

  return (
    <>
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <ExpertHistoryPageBody
        summary={summary}
        items={slice}
        page={page}
        totalItems={totalItems}
        allTimeCount={allRows.length}
        period={period}
        activeReportId={activeReportId}
        activeReportRequestId={activeReportRequestId}
        isLoading={isLoading}
      />
    </>
  );
}
