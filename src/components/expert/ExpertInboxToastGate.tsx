import { ExpertToast } from "@/components/expert/ExpertToast";
import { getExpiredRequestNotificationService } from "@/lib/expert/expiredRequestNotifications";
import { useExpertInbox } from "@/lib/expert/expertInboxStore";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import { useExpertSocket } from "@/lib/expert/expertSocketProvider";
import { normalizeMongoId } from "@/lib/expert/format";
import {
  planInboxReplay,
  unreadInboxIdsForRequest,
} from "@/lib/expert/inboxReplay";
import { usePathname } from "@/lib/router";
import { useEffect, useMemo, useRef, useState } from "react";

type QueuedToast = {
  title?: string;
  message: string;
};

function requestIdFromDetailPath(pathname: string): string | null {
  const match = pathname.match(/^\/expert\/queue\/([^/]+)\/?$/);
  const raw = match?.[1];
  return raw ? normalizeMongoId(raw) : null;
}

export function ExpertInboxToastGate() {
  const pathname = usePathname();
  const { profile } = useExpertProfile();
  const { requests, acceptedRequests, isLoading: panelLoading } =
    useExpertPanelData();
  const { items, isLoading: inboxLoading, markShown, markRead } =
    useExpertInbox();
  const { subscribeOffered, subscribeDeadlineMissed } = useExpertSocket();

  const [queue, setQueue] = useState<QueuedToast[]>([]);
  const processedIdsRef = useRef(new Set<string>());
  const markedReadRequestIdsRef = useRef(new Set<string>());
  const replayInFlightRef = useRef(false);
  const liveOfferIdsRef = useRef(new Set<string>());
  const liveDeadlineRequestIdsRef = useRef(new Set<string>());

  const expertId = profile?.id?.trim() ?? "";
  const openRequestId = requestIdFromDetailPath(pathname);
  const activeToast = queue[0] ?? null;

  useEffect(() => {
    processedIdsRef.current = new Set();
    markedReadRequestIdsRef.current = new Set();
    liveOfferIdsRef.current = new Set();
    liveDeadlineRequestIdsRef.current = new Set();
    setQueue([]);
  }, [expertId]);

  useEffect(() => {
    return subscribeOffered((payload) => {
      if (payload.offerId) liveOfferIdsRef.current.add(payload.offerId);
    });
  }, [subscribeOffered]);

  useEffect(() => {
    return subscribeDeadlineMissed((payload) => {
      if (payload.requestId) {
        liveDeadlineRequestIdsRef.current.add(payload.requestId);
      }
    });
  }, [subscribeDeadlineMissed]);

  const displayIdByRequestId = useMemo(() => {
    const map = new Map<string, string>();
    for (const request of [...acceptedRequests, ...requests]) {
      const id = normalizeMongoId(request._id);
      if (!id || map.has(id)) continue;
      if (typeof request.displayId === "string" && request.displayId.trim()) {
        map.set(id, request.displayId.trim());
      }
    }
    return map;
  }, [acceptedRequests, requests]);

  useEffect(() => {
    if (!expertId || inboxLoading || panelLoading || items.length === 0) {
      return;
    }
    if (replayInFlightRef.current) return;

    const unprocessed = items.filter(
      (item) => !item.isShown && !processedIdsRef.current.has(item.id),
    );
    if (unprocessed.length === 0) return;

    const plan = planInboxReplay(unprocessed, {
      openRequestId,
      liveOfferIds: liveOfferIdsRef.current,
      liveDeadlineRequestIds: liveDeadlineRequestIdsRef.current,
      displayIdByRequestId,
    });

    if (plan.markShownIds.length === 0 && plan.toasts.length === 0) return;

    for (const id of plan.markShownIds) {
      processedIdsRef.current.add(id);
    }

    replayInFlightRef.current = true;
    void (async () => {
      try {
        if (plan.toasts.length > 0) {
          setQueue((prev) => [
            ...prev,
            ...plan.toasts.map((toast) => ({
              title: toast.title,
              message: toast.message,
            })),
          ]);
        }

        const deadlineRequestIds = plan.toasts
          .filter((toast) => toast.kind === "deadline")
          .flatMap((toast) => toast.requestIds);

        if (deadlineRequestIds.length > 0) {
          const service = getExpiredRequestNotificationService();
          await service.recordExpired(
            expertId,
            deadlineRequestIds.map((requestId) => ({
              requestId,
              displayId: displayIdByRequestId.get(requestId),
              expiredAt: new Date().toISOString(),
            })),
          );
          await service.markShown(expertId, deadlineRequestIds);
        }

        await markShown(plan.markShownIds);
      } finally {
        replayInFlightRef.current = false;
      }
    })();
  }, [
    displayIdByRequestId,
    expertId,
    inboxLoading,
    items,
    markShown,
    openRequestId,
    panelLoading,
  ]);

  useEffect(() => {
    if (!openRequestId) return;
    if (markedReadRequestIdsRef.current.has(openRequestId)) return;

    const ids = unreadInboxIdsForRequest(items, openRequestId);
    if (ids.length === 0) return;

    markedReadRequestIdsRef.current.add(openRequestId);
    void markRead(ids);
  }, [items, markRead, openRequestId]);

  return (
    <ExpertToast
      open={Boolean(activeToast)}
      title={activeToast?.title}
      message={activeToast?.message ?? ""}
      variant="info"
      onClose={() => setQueue((prev) => prev.slice(1))}
    />
  );
}
