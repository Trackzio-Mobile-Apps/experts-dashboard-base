import { ExpertDraftsPageBody } from "@/components/expert/ExpertDraftsPageBody";
import { normalizeMongoId } from "@/lib/expert/format";
import { mapRequestToDraftItem } from "@/lib/expert/requestMappers";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import {
  extractReportIdFromRequest,
  getExpertReports,
  getReport,
  isDraftReport,
  matchReportIdForRequest,
  reportProgressPercent,
} from "@/lib/expert/reportsService";
import type { DraftListItem } from "@/lib/expert/types";
import { useEffect, useState } from "react";

export function ExpertDraftsPageClient() {
  const { draftsList, isLoading, error } = useExpertPanelData();
  const [items, setItems] = useState<DraftListItem[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const allowedIds = new Set(
      draftsList.map((request) => normalizeMongoId(request._id)).filter(Boolean),
    );

    setItems((prev) => prev.filter((row) => allowedIds.has(row.id)));

    void (async () => {
      if (draftsList.length === 0) {
        if (!cancelled) {
          setItems([]);
          setLoadingDrafts(false);
        }
        return;
      }

      setLoadingDrafts((wasLoading) => wasLoading || items.length === 0);

      try {
        let reports: Awaited<ReturnType<typeof getExpertReports>> = [];
        try {
          reports = await getExpertReports();
        } catch (err) {
          console.warn("[expert:draft] drafts page GET /experts/reports failed", err);
          reports = [];
        }
        console.log("[expert:draft] drafts page matching reports", {
          draftRequestCount: draftsList.length,
          reportCount: reports.length,
        });
        const rows = await Promise.all(
          draftsList.map(async (request) => {
            const requestId = normalizeMongoId(request._id);
            const fromRequest = extractReportIdFromRequest(request);
            const reportId =
              fromRequest || matchReportIdForRequest(reports, requestId);

            let progress = 0;
            if (reportId) {
              try {
                const report = await getReport(reportId);
                if (report && isDraftReport(report)) {
                  progress = reportProgressPercent(report);
                }
              } catch (err) {
                console.warn("[expert:draft] drafts page GET report failed", {
                  requestId,
                  reportId,
                  err,
                });
                progress = 0;
              }
            }

            console.log("[expert:draft] drafts row", {
              requestId,
              displayId: request.displayId ?? null,
              fromRequest,
              reportId,
              progress,
            });

            return mapRequestToDraftItem(request, progress);
          }),
        );

        if (!cancelled) {
          setItems(rows);
        }
      } finally {
        if (!cancelled) setLoadingDrafts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftsList]);

  return (
    <>
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <ExpertDraftsPageBody
        items={items}
        isLoading={isLoading || loadingDrafts}
      />
    </>
  );
}
