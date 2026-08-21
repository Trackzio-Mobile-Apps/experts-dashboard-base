import { ExpertDashboardSection } from "@/components/expert/ExpertDashboardSection";
import { ExpertQueuePageBody } from "@/components/expert/ExpertQueuePageBody";
import { ExpertToast } from "@/components/expert/ExpertToast";
import { QUEUE_PAGE_SIZE, LOGIN_SUCCESS_KEY } from "@/lib/expert/constants";
import { clearEvaluationDraft } from "@/lib/expert/evaluationDraftStorage";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import { useExpertSocket } from "@/lib/expert/expertSocketProvider";
import { useExpertQueuePolling } from "@/lib/expert/useExpertQueuePolling";
import {
  ExpertOffersError,
  formatOfferErrorMessage,
  skipOffer,
} from "@/lib/expert/offersService";
import { useSearchParams } from "@/lib/router";
import { useCallback, useEffect, useState } from "react";

export function ExpertQueuePageClient() {
  const searchParams = useSearchParams();
  const { queueList, isLoading, error, refresh } = useExpertPanelData();
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [showNewRequestToast, setShowNewRequestToast] = useState(false);
  const [showSkipToast, setShowSkipToast] = useState(false);
  const [newRequestCount, setNewRequestCount] = useState(0);
  const [skippingOfferId, setSkippingOfferId] = useState<string | null>(null);
  const [skipError, setSkipError] = useState<string | null>(null);

  const { subscribeOffered } = useExpertSocket();

  const handleNewOffers = useCallback((count: number) => {
    setNewRequestCount(count);
    setShowNewRequestToast(true);
  }, []);

  useExpertQueuePolling({
    enabled: !isLoading && !error,
    onNewOffers: handleNewOffers,
  });

  useEffect(() => {
    return subscribeOffered(() => {
      setNewRequestCount(1);
      setShowNewRequestToast(true);
    });
  }, [subscribeOffered]);

  useEffect(() => {
    if (
      window.sessionStorage.getItem(LOGIN_SUCCESS_KEY) !== "1"
    ) {
      return;
    }
    window.sessionStorage.removeItem(LOGIN_SUCCESS_KEY);
    const showTimer = window.setTimeout(() => {
      setShowLoginToast(true);
    }, 0);
    return () => window.clearTimeout(showTimer);
  }, []);

  const closeLoginToast = useCallback(() => setShowLoginToast(false), []);
  const closeNewRequestToast = useCallback(
    () => setShowNewRequestToast(false),
    [],
  );
  const closeSkipToast = useCallback(() => setShowSkipToast(false), []);

  const handleSkipOffer = useCallback(
    async (offerId: string, requestId: string) => {
      if (!offerId || skippingOfferId) return;

      const confirmed = window.confirm(
        "Reassign this request? It will be skipped and returned to the offer pool.",
      );
      if (!confirmed) return;

      setSkippingOfferId(offerId);
      setSkipError(null);
      try {
        await skipOffer(offerId);
        clearEvaluationDraft(requestId);
        await refresh();
        setShowSkipToast(true);
      } catch (err) {
        const status = err instanceof ExpertOffersError ? err.status : 0;
        const rawMessage =
          err instanceof Error ? err.message : "Unable to reassign offer.";
        const { message } = formatOfferErrorMessage(rawMessage, status, "skip");
        setSkipError(message);
      } finally {
        setSkippingOfferId(null);
      }
    },
    [refresh, skippingOfferId],
  );

  const newRequestMessage =
    newRequestCount === 1
      ? "1 new request in your queue"
      : `${newRequestCount} new requests in your queue`;

  const allItems = queueList;

  const raw = parseInt(String(searchParams.get("page") ?? "1"), 10);
  const totalItems = allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / QUEUE_PAGE_SIZE));
  const page = Number.isFinite(raw)
    ? Math.min(Math.max(1, raw), totalPages)
    : 1;

  const start = (page - 1) * QUEUE_PAGE_SIZE;
  const slice = allItems.slice(start, start + QUEUE_PAGE_SIZE);

  return (
    <ExpertDashboardSection>
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {skipError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {skipError}
        </p>
      ) : null}
      <ExpertQueuePageBody
        items={slice}
        page={page}
        totalItems={totalItems}
        isLoading={isLoading}
        skippingOfferId={skippingOfferId}
        onSkipOffer={handleSkipOffer}
      />
      <ExpertToast
        open={showLoginToast}
        message="Login successful"
        onClose={closeLoginToast}
      />
      <ExpertToast
        open={showNewRequestToast}
        title="New request"
        message={newRequestMessage}
        variant="info"
        onClose={closeNewRequestToast}
      />
      <ExpertToast
        open={showSkipToast}
        message="Request reassigned to another expert."
        onClose={closeSkipToast}
      />
    </ExpertDashboardSection>
  );
}
