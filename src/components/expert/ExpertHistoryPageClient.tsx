import { ExpertHistoryPageBody } from "@/components/expert/ExpertHistoryPageBody";
import { HISTORY_PAGE_SIZE } from "@/lib/expert/constants";
import {
  formatAvgTurnaround,
  normalizeMongoId,
  parseHistoryPeriod,
  parseHistoryReportParam,
  parseHistoryReportRequestParam,
} from "@/lib/expert/format";
import { mapRequestToHistoryRow } from "@/lib/expert/requestMappers";
import { extractReportIdFromRequest } from "@/lib/expert/reportsService";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import {
  getExpertRequests,
  historyPeriodRequestsQuery,
} from "@/lib/expert/requestsService";
import type { BackendRequest, HistorySummaryStats } from "@/lib/expert/types";
import { useSearchParams } from "@/lib/router";
import { useEffect, useMemo, useState } from "react";

export function ExpertHistoryPageClient() {
  const searchParams = useSearchParams();
  const { requests, offers, error: panelError } = useExpertPanelData();
  const { profile } = useExpertProfile();

  const period = parseHistoryPeriod(searchParams.get("period") ?? undefined);
  const activeReportId = parseHistoryReportParam(
    searchParams.get("report") ?? undefined,
  );
  const activeReportRequestId = parseHistoryReportRequestParam(
    searchParams.get("reportRequest") ?? undefined,
  );

  const [periodRequests, setPeriodRequests] = useState<BackendRequest[]>([]);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [periodError, setPeriodError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPeriodLoading(true);

    void (async () => {
      try {
        const next = await getExpertRequests(historyPeriodRequestsQuery(period));
        if (cancelled) return;
        setPeriodRequests(next);
        setPeriodError(null);
      } catch (err) {
        if (cancelled) return;
        setPeriodRequests([]);
        setPeriodError(
          err instanceof Error
            ? err.message
            : "Unable to load evaluation history.",
        );
      } finally {
        if (!cancelled) setPeriodLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [period]);

  const allRows = useMemo(
    () =>
      periodRequests
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
    [periodRequests, offers],
  );

  const allTimeCount = useMemo(
    () =>
      requests.filter((request) => {
        const status = mapRequestToHistoryRow(request).status;
        return status !== "draft";
      }).length,
    [requests],
  );

  const rawPage = parseInt(String(searchParams.get("page") ?? "1"), 10);
  const totalItems = allRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / HISTORY_PAGE_SIZE));
  const page = Number.isFinite(rawPage)
    ? Math.min(Math.max(1, rawPage), totalPages)
    : 1;

  const start = (page - 1) * HISTORY_PAGE_SIZE;
  const slice = allRows.slice(start, start + HISTORY_PAGE_SIZE);

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

  const error = periodError || panelError;

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
        allTimeCount={period === "all" ? totalItems : allTimeCount}
        period={period}
        activeReportId={activeReportId}
        activeReportRequestId={activeReportRequestId}
        isLoading={periodLoading}
      />
    </>
  );
}
