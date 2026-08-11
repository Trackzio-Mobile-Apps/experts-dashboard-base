"use client";

import { ExpertDraftsPageBody } from "@/components/expert/ExpertDraftsPageBody";
import { evaluateFormProgress } from "@/lib/expert/evaluationForm";
import { loadEvaluationDraft } from "@/lib/expert/evaluationDraftStorage";
import { normalizeMongoId } from "@/lib/expert/format";
import { mapRequestToDraftItem } from "@/lib/expert/requestMappers";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import {
  extractReportIdFromRequest,
  getReportForRequest,
  isDraftReport,
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

    // Drop expired rows immediately so the page matches the badge without waiting
    // on async progress fetches.
    setItems((prev) => prev.filter((row) => allowedIds.has(row.id)));

    void (async () => {
      if (draftsList.length === 0) {
        if (!cancelled) {
          setItems([]);
          setLoadingDrafts(false);
        }
        return;
      }

      // Only skeleton on first populate — not on every deadline-clock tick.
      setLoadingDrafts((wasLoading) => wasLoading || items.length === 0);

      try {
        const rows = await Promise.all(
          draftsList.map(async (request) => {
            const requestId = normalizeMongoId(request._id);
            const local = loadEvaluationDraft(requestId);
            const localProgress = local
              ? evaluateFormProgress(local).percent
              : 0;

            let progress = localProgress;
            const reportId = extractReportIdFromRequest(request);
            if (reportId) {
              const report = await getReportForRequest(requestId, { request });
              if (report && isDraftReport(report)) {
                progress = Math.max(progress, reportProgressPercent(report));
              }
            }

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
    // intentionally depend on draftsList only — items.length read for loader gate
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
