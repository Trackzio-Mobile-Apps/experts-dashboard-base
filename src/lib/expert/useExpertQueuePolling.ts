"use client";

import { QUEUE_POLL_INTERVAL_MS } from "@/lib/expert/constants";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import { useExpertSocket } from "@/lib/expert/expertSocketProvider";
import { normalizeMongoId } from "@/lib/expert/format";
import { useEffect, useRef } from "react";

type UseExpertQueuePollingOptions = {
  enabled: boolean;
  onNewOffers: (count: number) => void;
};

function offerIds(offers: { _id: unknown }[]): Set<string> {
  const ids = new Set<string>();
  for (const offer of offers) {
    const id = normalizeMongoId(offer._id);
    if (id) ids.add(id);
  }
  return ids;
}

/**
 * Fallback HTTP polling when the expert socket is disconnected.
 * Disabled automatically while Socket.IO is connected.
 */
export function useExpertQueuePolling({
  enabled,
  onNewOffers,
}: UseExpertQueuePollingOptions): void {
  const { offers, isLoading, refresh } = useExpertPanelData();
  const { isSocketConnected } = useExpertSocket();
  const knownOfferIdsRef = useRef<Set<string> | null>(null);
  const pollingReadyRef = useRef(false);
  const onNewOffersRef = useRef(onNewOffers);

  const pollingEnabled = enabled && !isSocketConnected;

  useEffect(() => {
    onNewOffersRef.current = onNewOffers;
  }, [onNewOffers]);

  useEffect(() => {
    if (!pollingEnabled || isLoading || pollingReadyRef.current) return;

    knownOfferIdsRef.current = offerIds(offers);
    pollingReadyRef.current = true;
  }, [pollingEnabled, isLoading, offers]);

  useEffect(() => {
    if (!pollingEnabled) {
      pollingReadyRef.current = false;
      knownOfferIdsRef.current = null;
      return;
    }

    if (isLoading) return;

    let cancelled = false;

    async function poll() {
      if (cancelled || document.hidden || !pollingReadyRef.current) return;

      const data = await refresh({ silent: true, scope: "offers" });
      if (cancelled || !data) return;

      const known = knownOfferIdsRef.current ?? new Set<string>();
      const incoming = offerIds(data.offers);
      let newCount = 0;

      for (const id of incoming) {
        if (!known.has(id)) newCount += 1;
      }

      knownOfferIdsRef.current = incoming;

      if (newCount > 0) {
        onNewOffersRef.current(newCount);
      }
    }

    const intervalId = window.setInterval(() => {
      void poll();
    }, QUEUE_POLL_INTERVAL_MS);

    function handleVisibilityChange() {
      if (!document.hidden) {
        void poll();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      pollingReadyRef.current = false;
      knownOfferIdsRef.current = null;
    };
  }, [pollingEnabled, isLoading, refresh]);
}
