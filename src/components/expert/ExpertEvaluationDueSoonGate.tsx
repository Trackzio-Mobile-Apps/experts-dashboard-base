"use client";

import { ExpertEvaluationDueSoonModal } from "@/components/expert/ExpertEvaluationDueSoonModal";
import { EVALUATION_DUE_SOON_PROMPT_KEY } from "@/lib/expert/constants";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import { formatQueueRequestIdLabel } from "@/lib/expert/format";
import { findSoonestEvaluationDueSoon } from "@/lib/expert/requestMappers";
import { useRouter } from "@/lib/router";
import { useCallback, useEffect, useState } from "react";

type DueSoonState = {
  requestId: string;
  requestLabel: string;
  hoursRemaining: number;
};

/**
 * After each expert login, if any incomplete evaluation is within the last 24
 * hours, show a reminder for the one with the least time remaining.
 */
export function ExpertEvaluationDueSoonGate() {
  const router = useRouter();
  const { acceptedRequests, isLoading } = useExpertPanelData();
  const [dueSoon, setDueSoon] = useState<DueSoonState | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return;
    if (sessionStorage.getItem(EVALUATION_DUE_SOON_PROMPT_KEY) !== "1") {
      return;
    }

    const candidate = findSoonestEvaluationDueSoon(acceptedRequests);
    if (!candidate) {
      sessionStorage.removeItem(EVALUATION_DUE_SOON_PROMPT_KEY);
      return;
    }

    setDueSoon({
      requestId: candidate.requestId,
      requestLabel: formatQueueRequestIdLabel(candidate.displayId),
      hoursRemaining: candidate.hoursRemaining,
    });
  }, [acceptedRequests, isLoading]);

  const dismissPrompt = useCallback(() => {
    try {
      sessionStorage.removeItem(EVALUATION_DUE_SOON_PROMPT_KEY);
    } catch {
      // ignore
    }
    setDueSoon(null);
  }, []);

  const handleGoToRequest = useCallback(() => {
    if (!dueSoon) return;
    const href = `/expert/queue/${dueSoon.requestId}`;
    dismissPrompt();
    router.push(href);
  }, [dismissPrompt, dueSoon, router]);

  return (
    <ExpertEvaluationDueSoonModal
      open={Boolean(dueSoon)}
      hoursRemaining={dueSoon?.hoursRemaining ?? 0}
      requestLabel={dueSoon?.requestLabel ?? "REQ-ID —"}
      onLater={dismissPrompt}
      onGoToRequest={handleGoToRequest}
    />
  );
}
