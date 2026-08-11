"use client";

import { ExpertEvaluationRequestView } from "@/components/expert/ExpertEvaluationRequestView";
import { ExpertRequestDetailSkeleton } from "@/components/expert/ExpertSkeleton";
import {
  acceptOffer,
  ExpertOffersError,
  formatOfferErrorMessage,
} from "@/lib/expert/offersService";
import {
  loadEvaluationDraftReportId,
  saveEvaluationDraftReportId,
} from "@/lib/expert/evaluationDraftStorage";
import { buildEvaluationDetail } from "@/lib/expert/requestMappers";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import {
  ensureDraftReport,
  extractReportIdFromRequest,
} from "@/lib/expert/reportsService";
import { formatRequestId, normalizeMongoId } from "@/lib/expert/format";
import type {
  BackendRequest,
  EvaluationRequestDetail,
} from "@/lib/expert/types";
import { useRouter, useSearchParams } from "@/lib/router";
import { useCallback, useEffect, useMemo, useState } from "react";

type ExpertQueueRequestPageClientProps = {
  requestId: string;
};

export function ExpertQueueRequestPageClient({
  requestId,
}: ExpertQueueRequestPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawOfferId = searchParams.get("offerId");
  const offerId =
    rawOfferId && rawOfferId !== "[object Object]"
      ? normalizeMongoId(rawOfferId)
      : undefined;
  const { offers, requests, acceptedRequests, isLoading, refresh } =
    useExpertPanelData();
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  /** After a successful Accept — keeps the evaluation form open. */
  const [accepted, setAccepted] = useState(false);
  const [showAcceptedToast, setShowAcceptedToast] = useState(false);
  /** Report id from accept/create — list API often omits it until later. */
  const [knownReportId, setKnownReportId] = useState<string | null>(() =>
    loadEvaluationDraftReportId(requestId),
  );

  const requestFromStore = useMemo(
    () =>
      requests.find((r) => normalizeMongoId(r._id) === requestId) ??
      acceptedRequests.find((r) => normalizeMongoId(r._id) === requestId) ??
      offers.find((o) => normalizeMongoId(o.request._id) === requestId)?.request,
    [requests, acceptedRequests, offers, requestId],
  );

  // Keep the last known request so when another expert accepts (offer leaves
  // this expert's queue) we can still render the Figma "Request unavailable"
  // screen instead of "Request not found".
  const [stickyRequest, setStickyRequest] = useState<BackendRequest | null>(
    null,
  );

  useEffect(() => {
    if (requestFromStore) {
      setStickyRequest(requestFromStore);
    }
  }, [requestFromStore]);

  useEffect(() => {
    if (
      accepted &&
      !requestFromStore &&
      stickyRequest &&
      stickyRequest.status !== "accepted"
    ) {
      setStickyRequest({ ...stickyRequest, status: "accepted" as const });
    }
  }, [accepted, requestFromStore, stickyRequest]);

  const request = requestFromStore ?? stickyRequest;

  const matchedOffer = useMemo(() => {
    const byOfferId = offerId
      ? offers.find((o) => normalizeMongoId(o._id) === offerId)
      : undefined;
    if (byOfferId) return byOfferId;
    return offers.find(
      (o) => normalizeMongoId(o.request._id) === requestId,
    );
  }, [offers, offerId, requestId]);

  const matchedOfferId = matchedOffer
    ? normalizeMongoId(matchedOffer._id)
    : undefined;
  // Prefer live offer match; keep URL offerId after accept for queue sync.
  const actionOfferId = matchedOfferId ?? offerId;

  useEffect(() => {
    const fromRequest = request
      ? extractReportIdFromRequest(request)
      : null;
    const fromLocal = loadEvaluationDraftReportId(requestId);
    const next = fromRequest || fromLocal;
    if (next) {
      setKnownReportId((prev) => prev || next);
      saveEvaluationDraftReportId(requestId, next);
    }
  }, [request, requestId]);

  // Offer left this expert's queue (e.g. another expert accepted) while this
  // page is still open. Do not use URL offerId here — that stale id would
  // keep Accept enabled after the live offer is gone.
  const lostOffer =
    !isLoading &&
    !accepted &&
    !matchedOfferId &&
    request?.status === "offered";

  const detail = useMemo<EvaluationRequestDetail | null>(() => {
    if (!request) return null;

    const deadlineMissedStatus =
      request.status === "deadline_missed" || request.status === "expired";

    // Once accepted on this screen, keep the evaluation form open even if
    // refresh is still catching up — but never overwrite a missed deadline.
    const requestForView =
      deadlineMissedStatus
        ? request
        : accepted || request.status === "accepted"
          ? { ...request, status: "accepted" as const }
          : request;

    const isUnavailable = unavailable || lostOffer;

    return buildEvaluationDetail({
      request: requestForView,
      // Hide Accept when the live offer is gone (ignore stale URL offerId).
      offerId: isUnavailable ? undefined : actionOfferId,
      unavailable: isUnavailable,
      reportId: knownReportId,
    });
  }, [
    request,
    actionOfferId,
    unavailable,
    lostOffer,
    accepted,
    knownReportId,
  ]);

  // Already accepted on the server → open evaluation form.
  useEffect(() => {
    if (
      request?.status === "accepted" ||
      request?.status === "deadline_missed" ||
      request?.status === "expired"
    ) {
      setAccepted(true);
      setUnavailable(false);
    }
  }, [request?.status]);

  const handleAccept = useCallback(async () => {
    // Only accept from a live queue offer — never a stale URL offerId.
    if (!matchedOfferId || accepting) return;

    setAccepting(true);
    setAcceptError(null);
    try {
      console.log("[expert] accepting offer", {
        offerId: matchedOfferId,
        requestId,
      });
      await acceptOffer(matchedOfferId);
      setAccepted(true);
      setShowAcceptedToast(true);
      setUnavailable(false);
      const coinName =
        typeof request?.coinTitle === "string" && request.coinTitle.trim()
          ? request.coinTitle.trim()
          : undefined;
      try {
        const draft = await ensureDraftReport({
          requestId,
          reportId: knownReportId,
          coinName,
        });
        const reportId = normalizeMongoId(draft._id);
        if (reportId) {
          setKnownReportId(reportId);
          saveEvaluationDraftReportId(requestId, reportId);
        }
      } catch (draftErr) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[expert] initial draft create failed", draftErr);
        }
      }
      // Keep the evaluation form mounted — sync queue data in the background.
      await refresh({ silent: true });
    } catch (err) {
      const status = err instanceof ExpertOffersError ? err.status : 0;
      const rawMessage =
        err instanceof Error ? err.message : "Unable to accept offer.";

      // Offer may be stale while the request is already yours — recover after refresh.
      const refreshed = await refresh({ silent: true });
      const latestRequest =
        refreshed?.acceptedRequests.find(
          (r) => normalizeMongoId(r._id) === requestId,
        ) ??
        refreshed?.requests.find(
          (r) => normalizeMongoId(r._id) === requestId,
        );

      if (latestRequest?.status === "accepted") {
        setAccepted(true);
        setUnavailable(false);
        setAcceptError(null);
        const recoveredId = extractReportIdFromRequest(latestRequest);
        if (recoveredId) {
          setKnownReportId(recoveredId);
          saveEvaluationDraftReportId(requestId, recoveredId);
        }
        return;
      }

      const { message, markUnavailable } = formatOfferErrorMessage(
        rawMessage,
        status,
        "accept",
      );

      if (markUnavailable) {
        setUnavailable(true);
        setAcceptError(null);
      } else {
        setAcceptError(message);
      }
    } finally {
      setAccepting(false);
    }
  }, [matchedOfferId, accepting, requestId, refresh, request, knownReportId]);

  // Only skeleton on first load — never unmount the form after it has opened.
  if (isLoading && !detail) {
    return <ExpertRequestDetailSkeleton />;
  }

  if (!detail) {
    return (
      <div className="rounded-2xl border border-border/80 bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-text">
              Ready to evaluate?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Begin the evaluation to access the form, review the images, and
              complete the report.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/expert/queue")}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-primary px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            Back to Queue
          </button>
        </div>

        <div
          role="status"
          className="mt-4 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
        >
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-800 text-xs font-bold"
            aria-hidden
          >
            i
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Request unavailable</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
              Another expert has already accepted this request. Please return to
              the queue to pick a different one.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ExpertEvaluationRequestView
      detail={detail}
      accepting={accepting}
      acceptError={acceptError}
      showAcceptedToast={showAcceptedToast}
      onAccept={handleAccept}
      onDismissToast={() => setShowAcceptedToast(false)}
      onSubmitted={async () => {
        await refresh();
        router.push("/expert/history");
      }}
    />
  );
}

export function queueRequestTitle(requestId: string): string {
  return `REQ-${formatRequestId(requestId)}`;
}
