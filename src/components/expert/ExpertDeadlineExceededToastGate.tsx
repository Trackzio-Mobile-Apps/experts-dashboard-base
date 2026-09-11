import { ExpertToast } from "@/components/expert/ExpertToast";
import {
  collectExpiredRequestNotifications,
  formatExpiredRequestToastMessage,
  getExpiredRequestNotificationService,
} from "@/lib/expert/expiredRequestNotifications";
import { normalizeMongoId } from "@/lib/expert/format";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import { useExpertSocket } from "@/lib/expert/expertSocketProvider";
import { useDeadlineClock } from "@/lib/expert/useDeadlineClock";
import { usePathname } from "@/lib/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type QueuedToast = {
  message: string;
  requestIds: string[];
};

function isRequestDetailPath(pathname: string): boolean {
  return /^\/expert\/queue\/[^/]+\/?$/.test(pathname);
}

function requestIdFromDetailPath(pathname: string): string | null {
  const match = pathname.match(/^\/expert\/queue\/([^/]+)\/?$/);
  const raw = match?.[1];
  return raw ? normalizeMongoId(raw) : null;
}

/**
 * Records expired requests into the notification store and shows unshown
 * expiry toasts on expert panel pages.
 *
 * Detection uses both `acceptedRequests` and full `requests` so expiries that
 * the backend already moved to `deadline_missed` / `expired` are still found
 * after login (when they no longer appear in accepted-only lists).
 */
export function ExpertDeadlineExceededToastGate() {
  const pathname = usePathname();
  const { profile } = useExpertProfile();
  const { acceptedRequests, requests, isLoading } = useExpertPanelData();
  const { subscribeDeadlineMissed } = useExpertSocket();
  const nowMs = useDeadlineClock(15_000);
  const service = getExpiredRequestNotificationService();

  const [queue, setQueue] = useState<QueuedToast[]>([]);
  const flushInFlightRef = useRef(false);
  const recordedIdsRef = useRef(new Set<string>());

  const expertId = profile?.id?.trim() ?? "";
  const activeMessage = queue[0]?.message ?? null;
  const openRequestId = isRequestDetailPath(pathname)
    ? requestIdFromDetailPath(pathname)
    : null;

  const expirySourceRequests = useMemo(() => {
    const byId = new Map<string, (typeof requests)[number]>();
    for (const request of [...acceptedRequests, ...requests]) {
      const id = normalizeMongoId(request._id);
      if (!id || byId.has(id)) continue;
      byId.set(id, request);
    }
    return [...byId.values()];
  }, [acceptedRequests, requests]);

  const displayIdByRequestId = useMemo(() => {
    const map = new Map<string, string>();
    for (const request of expirySourceRequests) {
      const id = normalizeMongoId(request._id);
      if (!id || map.has(id)) continue;
      if (typeof request.displayId === "string" && request.displayId.trim()) {
        map.set(id, request.displayId.trim());
      }
    }
    return map;
  }, [expirySourceRequests]);

  const openRequestIdRef = useRef(openRequestId);
  const expertIdRef = useRef(expertId);
  const displayIdByRequestIdRef = useRef(displayIdByRequestId);

  useEffect(() => {
    openRequestIdRef.current = openRequestId;
  }, [openRequestId]);

  useEffect(() => {
    expertIdRef.current = expertId;
  }, [expertId]);

  useEffect(() => {
    displayIdByRequestIdRef.current = displayIdByRequestId;
  }, [displayIdByRequestId]);

  const enqueueToasts = useCallback((toasts: QueuedToast[]) => {
    if (toasts.length === 0) return;
    setQueue((prev) => [...prev, ...toasts]);
  }, []);

  useEffect(() => {
    return subscribeDeadlineMissed((payload) => {
      const requestId = payload.requestId
        ? normalizeMongoId(payload.requestId)
        : "";
      const currentExpertId = expertIdRef.current;
      if (!requestId || !currentExpertId) return;
      if (recordedIdsRef.current.has(requestId)) return;

      recordedIdsRef.current.add(requestId);

      const notification = {
        requestId,
        displayId: displayIdByRequestIdRef.current.get(requestId),
        expiredAt: new Date().toISOString(),
      };

      void (async () => {
        await service.recordExpired(currentExpertId, [notification]);

        if (openRequestIdRef.current === requestId) {
          return;
        }

        await service.markShown(currentExpertId, [requestId]);
        const message = formatExpiredRequestToastMessage([notification]);
        if (message) {
          enqueueToasts([{ message, requestIds: [requestId] }]);
        }
      })();
    });
  }, [enqueueToasts, service, subscribeDeadlineMissed]);

  const flushUnshown = useCallback(async () => {
    if (!expertId || flushInFlightRef.current) return;

    flushInFlightRef.current = true;
    try {
      const toasts = await service.takeUnshownToastMessages(expertId, 3, {
        excludeRequestIds: openRequestId ? [openRequestId] : [],
      });
      enqueueToasts(toasts);
    } finally {
      flushInFlightRef.current = false;
    }
  }, [expertId, enqueueToasts, openRequestId, service]);

  // Detect newly expired requests (active + History-eligible) and persist them.
  useEffect(() => {
    if (!expertId || isLoading) return;

    const expired = collectExpiredRequestNotifications(
      expirySourceRequests,
      nowMs,
    );
    if (expired.length === 0) return;

    const fresh = expired.filter(
      (item) => !recordedIdsRef.current.has(item.requestId),
    );
    if (fresh.length === 0) return;

    for (const item of fresh) {
      recordedIdsRef.current.add(item.requestId);
    }

    void (async () => {
      await service.recordExpired(expertId, fresh);
      await flushUnshown();
    })();
  }, [
    expirySourceRequests,
    expertId,
    flushUnshown,
    isLoading,
    nowMs,
    service,
  ]);

  // Panel load / navigation: surface any unshown notifications.
  useEffect(() => {
    if (!expertId || isLoading) return;
    void flushUnshown();
  }, [expertId, flushUnshown, isLoading, pathname]);

  const onClose = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  return (
    <ExpertToast
      open={Boolean(activeMessage)}
      message={activeMessage ?? ""}
      variant="info"
      onClose={onClose}
    />
  );
}
