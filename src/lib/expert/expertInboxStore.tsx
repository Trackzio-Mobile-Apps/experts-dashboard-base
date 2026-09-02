import {
  getExpertInbox,
  markExpertInboxItemsRead,
  markExpertInboxItemsShown,
} from "@/lib/expert/inboxService";
import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import { useExpertSocket } from "@/lib/expert/expertSocketProvider";
import type { ExpertInboxItem } from "@/lib/expert/types";
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

type ExpertInboxContextValue = {
  items: ExpertInboxItem[];
  isLoading: boolean;
  markShown: (ids: string[]) => Promise<void>;
  markRead: (ids: string[]) => Promise<void>;
};

const ExpertInboxContext = createContext<ExpertInboxContextValue | null>(null);

const REFRESH_DEBOUNCE_MS = 600;

export function ExpertInboxProvider({ children }: { children: ReactNode }) {
  const { profile, isInitialized } = useExpertProfile();
  const { subscribeInboxSync, isSocketConnected } = useExpertSocket();

  const [items, setItems] = useState<ExpertInboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const expertId = profile?.id?.trim() ?? "";
  const refreshTimerRef = useRef<number | null>(null);

  const refreshInbox = useCallback(async () => {
    if (!expertId) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await getExpertInbox());
    } catch (error) {
      console.warn("[expert-inbox] failed to load inbox", error);
    } finally {
      setIsLoading(false);
    }
  }, [expertId]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current != null) {
      window.clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      void refreshInbox();
    }, REFRESH_DEBOUNCE_MS);
  }, [refreshInbox]);

  useEffect(() => {
    if (!isInitialized || !expertId) {
      setItems([]);
      return;
    }
    void refreshInbox();
  }, [expertId, isInitialized, refreshInbox]);

  useEffect(() => {
    if (!isSocketConnected || !expertId) return;
    scheduleRefresh();
  }, [expertId, isSocketConnected, scheduleRefresh]);

  useEffect(() => {
    return subscribeInboxSync(scheduleRefresh);
  }, [scheduleRefresh, subscribeInboxSync]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current != null) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const markShown = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setItems((prev) =>
      prev.map((item) =>
        idSet.has(item.id) ? { ...item, isShown: true } : item,
      ),
    );
    await markExpertInboxItemsShown(ids);
  }, []);

  const markRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setItems((prev) =>
      prev.map((item) =>
        idSet.has(item.id) ? { ...item, isRead: true } : item,
      ),
    );
    await markExpertInboxItemsRead(ids);
  }, []);

  const value = useMemo<ExpertInboxContextValue>(
    () => ({ items, isLoading, markShown, markRead }),
    [items, isLoading, markRead, markShown],
  );

  return (
    <ExpertInboxContext.Provider value={value}>
      {children}
    </ExpertInboxContext.Provider>
  );
}

export function useExpertInbox(): ExpertInboxContextValue {
  const ctx = useContext(ExpertInboxContext);
  if (!ctx) {
    throw new Error("useExpertInbox must be used within ExpertInboxProvider");
  }
  return ctx;
}
