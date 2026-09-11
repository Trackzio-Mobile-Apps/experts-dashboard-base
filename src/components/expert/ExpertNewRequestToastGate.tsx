import { ExpertToast } from "@/components/expert/ExpertToast";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import { useExpertSocket } from "@/lib/expert/expertSocketProvider";
import { useExpertQueuePolling } from "@/lib/expert/useExpertQueuePolling";
import { useCallback, useEffect, useState } from "react";

/**
 * Shows "new request" toasts on every expert panel screen (socket + HTTP fallback).
 */
export function ExpertNewRequestToastGate() {
  const { isLoading, error } = useExpertPanelData();
  const { subscribeOffered } = useExpertSocket();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  const handleNewOffers = useCallback((nextCount: number) => {
    setCount(nextCount);
    setOpen(true);
  }, []);

  useExpertQueuePolling({
    enabled: !isLoading && !error,
    onNewOffers: handleNewOffers,
  });

  useEffect(() => {
    return subscribeOffered(() => {
      setCount(1);
      setOpen(true);
    });
  }, [subscribeOffered]);

  const message =
    count === 1
      ? "1 new request in your queue"
      : `${count} new requests in your queue`;

  return (
    <ExpertToast
      open={open}
      title="New request"
      message={message}
      variant="info"
      onClose={() => setOpen(false)}
    />
  );
}
