import { ExpertEvaluationReportContent } from "@/components/expert/ExpertEvaluationReportContent";
import { ExpertReportModalSkeleton } from "@/components/expert/ExpertSkeleton";
import {
  buildEvaluationReportDisplay,
  buildEvaluationReportExpertDisplay,
  EVALUATION_REPORT_LAYOUT_VERSION,
  type EvaluationReportDisplay,
} from "@/lib/expert/evaluationReportView";
import {
  downloadEvaluationReportPdf,
} from "@/lib/expert/evaluationReportExport";
import {
  loadExtendedProfile,
} from "@/lib/expert/expertProfileExtended";
import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import { getExpertReviews } from "@/lib/expert/reviewsService";
import { buildExpertHistoryHref, normalizeMongoId, type HistoryPeriodFilter } from "@/lib/expert/format";
import { resolveReport, extractReportIdFromRequest } from "@/lib/expert/reportsService";
import { useRouter } from "@/lib/router";
import { useCallback, useEffect, useRef, useState } from "react";

type CertReportModalProps = {
  reportId: string | null;
  reportRequestId?: string | null;
  page: number;
  period: HistoryPeriodFilter;
};

export function CertReportModal({
  reportId,
  reportRequestId = null,
  page,
  period,
}: CertReportModalProps) {
  const router = useRouter();
  const { profile } = useExpertProfile();
  const { requests } = useExpertPanelData();
  const [report, setReport] = useState<EvaluationReportDisplay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    router.replace(buildExpertHistoryHref({ page, period }));
  }, [router, page, period]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const normalizedReportId = reportId
          ? normalizeMongoId(reportId)
          : "";
        const normalizedRequestId = reportRequestId
          ? normalizeMongoId(reportRequestId)
          : "";

        const requestHint =
          requests.find((item) => {
            const itemRequestId = normalizeMongoId(item._id);
            if (
              normalizedRequestId &&
              itemRequestId === normalizedRequestId
            ) {
              return true;
            }
            if (
              normalizedReportId &&
              extractReportIdFromRequest(item) === normalizedReportId
            ) {
              return true;
            }
            return false;
          }) ?? undefined;

        const backendReport = await resolveReport(
          reportId,
          reportRequestId ?? requestHint?._id ?? null,
          requestHint,
        );
        if (cancelled) return;

        const request = requests.find(
          (item) =>
            normalizeMongoId(item._id) ===
            normalizeMongoId(backendReport.requestId),
        );

        let expertDisplay = buildEvaluationReportExpertDisplay(profile);
        if (profile?.id) {
          try {
            const extended = loadExtendedProfile(profile.id);
            const reviewsResult = await getExpertReviews();
            expertDisplay = buildEvaluationReportExpertDisplay(profile, {
              ratingAverage: reviewsResult.average,
              ratingCount: reviewsResult.count,
              expertiseTags:
                extended.expertiseCategories.length > 0
                  ? extended.expertiseCategories
                  : undefined,
            });
          } catch {
            // Keep profile-only expert card if reviews fail to load.
          }
        }

        setReport(
          buildEvaluationReportDisplay(backendReport, {
            requestPayload: request?.payload,
            expert: expertDisplay,
          }),
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load report. Open this evaluation from the device where you submitted it, or contact support.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, reportId, reportRequestId, requests]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [close]);

  async function handleDownloadPdf() {
    if (!report || downloadingPdf) return;

    setDownloadingPdf(true);
    try {
      await downloadEvaluationReportPdf(report, {
        previewRoot: previewRef.current,
        version: EVALUATION_REPORT_LAYOUT_VERSION,
      });
    } catch (err) {
      console.error("PDF export failed:", err);
      window.alert(
        err instanceof Error
          ? err.message
          : "Unable to generate PDF. Please try again.",
      );
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/80 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evaluation-report-title"
    >
      <button
        type="button"
        className="absolute inset-0 z-[100] cursor-default bg-transparent"
        aria-label="Close report"
        onClick={close}
      />

      <div className="relative z-[101] flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-surface shadow-2xl ring-1 ring-black/10">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/80 bg-surface px-4 py-3">
          <h2
            id="evaluation-report-title"
            className="mr-auto text-sm font-semibold text-text"
          >
            Evaluation report
          </h2>
          <button
            type="button"
            onClick={() => void handleDownloadPdf()}
            disabled={!report || loading || downloadingPdf}
            className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloadingPdf ? "Generating PDF…" : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-input-bg hover:text-text"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div
          ref={previewRef}
          className="flex min-h-0 flex-1 flex-col items-center overflow-auto px-5 py-6 sm:px-8 sm:py-8"
        >
          {loading ? (
            <ExpertReportModalSkeleton />
          ) : error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : report ? (
            <ExpertEvaluationReportContent
              report={report}
              version={EVALUATION_REPORT_LAYOUT_VERSION}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
