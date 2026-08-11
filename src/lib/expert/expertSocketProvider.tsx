"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import {
  disconnectExpertSocket,
  resolveAndConnectExpertSocket,
  type ExpertSocketHandlers,
} from "@/lib/expert/socket/expertSocketService";
import type {
  ExpertSocketConnectionState,
  ExpertSocketEventPayload,
} from "@/lib/expert/socket/types";

const OFFER_TOAST_DEDUPE_MS = 60_000;

type OfferedListener = (payload: ExpertSocketEventPayload) => void;
type DeadlineMissedListener = (payload: ExpertSocketEventPayload) => void;

type ExpertSocketContextValue = {
  connectionState: ExpertSocketConnectionState;
  isSocketConnected: boolean;
  subscribeOffered: (listener: OfferedListener) => () => void;
  subscribeDeadlineMissed: (listener: DeadlineMissedListener) => () => void;
};

const ExpertSocketContext = createContext<ExpertSocketContextValue | null>(null);

export function ExpertSocketProvider({ children }: { children: ReactNode }) {
  const { profile, isInitialized } = useExpertProfile();
  const { refresh } = useExpertPanelData();
  const [connectionState, setConnectionState] =
    useState<ExpertSocketConnectionState>("disconnected");

  const refreshRef = useRef(refresh);
  const offeredListenersRef = useRef(new Set<OfferedListener>());
  const deadlineMissedListenersRef = useRef(new Set<DeadlineMissedListener>());
  const recentOfferToastsRef = useRef(new Map<string, number>());
  const handlersRef = useRef<ExpertSocketHandlers>({
    onConnectionStateChange: setConnectionState,
    onOffered: () => {},
    onWithdrawn: () => {},
    onAccepted: () => {},
    onDeadlineMissed: () => {},
  });

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const notifyOffered = useCallback((payload: ExpertSocketEventPayload) => {
    const offerId = payload.offerId;
    if (offerId) {
      const now = Date.now();
      const lastShown = recentOfferToastsRef.current.get(offerId);
      if (lastShown != null && now - lastShown < OFFER_TOAST_DEDUPE_MS) {
        return;
      }
      recentOfferToastsRef.current.set(offerId, now);
    }

    for (const listener of offeredListenersRef.current) {
      listener(payload);
    }
  }, []);

  const notifyDeadlineMissed = useCallback(
    (payload: ExpertSocketEventPayload) => {
      for (const listener of deadlineMissedListenersRef.current) {
        listener(payload);
      }
    },
    [],
  );

  useEffect(() => {
    handlersRef.current = {
      onConnectionStateChange: setConnectionState,
      onOffered: (payload) => {
        console.log("[expert-socket] refresh triggered (offers)", payload);
        void refreshRef.current({ silent: true, scope: "offers" });
        notifyOffered(payload);
      },
      onWithdrawn: (payload) => {
        console.log("[expert-socket] refresh triggered (offers)", payload);
        void refreshRef.current({ silent: true, scope: "offers" });
      },
      onAccepted: (payload) => {
        console.log("[expert-socket] refresh triggered (all)", payload);
        void refreshRef.current({ silent: true, scope: "all" });
      },
      onDeadlineMissed: (payload) => {
        console.log("[expert-socket] refresh triggered (requests)", payload);
        void refreshRef.current({ silent: true, scope: "requests" });
        notifyDeadlineMissed(payload);
      },
    };
  }, [notifyDeadlineMissed, notifyOffered]);

  useEffect(() => {
    if (!isInitialized || !profile?.id) {
      disconnectExpertSocket();
      setConnectionState("disconnected");
      return;
    }

    const controller = new AbortController();
    let detach: (() => void) | undefined;

    void resolveAndConnectExpertSocket({
      expertId: profile.id,
      handlers: handlersRef.current,
      signal: controller.signal,
    }).then((cleanup) => {
      if (controller.signal.aborted) {
        cleanup();
        return;
      }
      detach = cleanup;
    });

    return () => {
      controller.abort();
      detach?.();
    };
  }, [isInitialized, profile?.id, notifyOffered]);

  const subscribeOffered = useCallback((listener: OfferedListener) => {
    offeredListenersRef.current.add(listener);
    return () => {
      offeredListenersRef.current.delete(listener);
    };
  }, []);

  const subscribeDeadlineMissed = useCallback(
    (listener: DeadlineMissedListener) => {
      deadlineMissedListenersRef.current.add(listener);
      return () => {
        deadlineMissedListenersRef.current.delete(listener);
      };
    },
    [],
  );

  const value = useMemo<ExpertSocketContextValue>(
    () => ({
      connectionState,
      isSocketConnected: connectionState === "connected",
      subscribeOffered,
      subscribeDeadlineMissed,
    }),
    [connectionState, subscribeDeadlineMissed, subscribeOffered],
  );

  return (
    <ExpertSocketContext.Provider value={value}>
      {children}
    </ExpertSocketContext.Provider>
  );
}

export function useExpertSocket(): ExpertSocketContextValue {
  const ctx = useContext(ExpertSocketContext);
  if (!ctx) {
    throw new Error("useExpertSocket must be used within ExpertSocketProvider");
  }
  return ctx;
}
