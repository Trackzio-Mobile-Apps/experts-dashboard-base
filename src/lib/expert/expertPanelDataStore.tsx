import { normalizeMongoId } from "@/lib/expert/format";
import {
  buildDraftsList,
  buildNewRequestsList,
  buildQueueList,
} from "@/lib/expert/requestMappers";
import {
  getAcceptedRequests,
  getExpertOffers,
  getExpertRequests,
} from "@/lib/expert/requestsService";
import type {
  BackendOffer,
  BackendRequest,
  ExpertNavCounts,
  QueueListItem,
} from "@/lib/expert/types";
import { useDeadlineClock } from "@/lib/expert/useDeadlineClock";
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

/** Keep list identity stable across deadline ticks when membership is unchanged.
 * Always accept a new list when underlying source data is replaced (API refresh). */
function useStableIdList<T>(
  list: T[],
  sources: unknown[],
  getId: (item: T) => string,
): T[] {
  const ref = useRef({ sources, list });
  const sourceChanged =
    ref.current.sources.length !== sources.length ||
    ref.current.sources.some((source, index) => source !== sources[index]);
  const membershipChanged =
    ref.current.list.length !== list.length ||
    ref.current.list.some((item, index) => getId(item) !== getId(list[index]!));
  if (sourceChanged || membershipChanged) {
    ref.current = { sources, list };
  }
  return ref.current.list;
}

type ExpertPanelRefreshResult = {
  offers: BackendOffer[];
  requests: BackendRequest[];
  acceptedRequests: BackendRequest[];
};

type ExpertPanelRefreshScope = "all" | "offers" | "requests";

type ExpertPanelRefreshOptions = {
  /** Skip loading UI — for background polling on the queue home page. */
  silent?: boolean;
  /** Which REST resources to refetch. Defaults to all. */
  scope?: ExpertPanelRefreshScope;
};

type ExpertPanelDataContextValue = {
  offers: BackendOffer[];
  requests: BackendRequest[];
  acceptedRequests: BackendRequest[];
  /** Canonical Queue list — page and badge both use this. */
  queueList: QueueListItem[];
  /** Eligible unaccepted offers — dashboard New Requests count. */
  newRequestsList: BackendOffer[];
  /** Active accepted drafts — page and badge both use this. */
  draftsList: BackendRequest[];
  isLoading: boolean;
  error: string | null;
  navCounts: ExpertNavCounts;
  refresh: (
    options?: ExpertPanelRefreshOptions,
  ) => Promise<ExpertPanelRefreshResult | null>;
};

type PanelLists = ExpertPanelRefreshResult;

type InFlightRefresh = {
  promise: Promise<ExpertPanelRefreshResult | null>;
  scope: ExpertPanelRefreshScope;
};

const ExpertPanelDataContext =
  createContext<ExpertPanelDataContextValue | null>(null);

function scopeCovers(
  inFlight: ExpertPanelRefreshScope,
  requested: ExpertPanelRefreshScope,
): boolean {
  if (inFlight === "all") return true;
  return inFlight === requested;
}

export function ExpertPanelDataProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<PanelLists>({
    offers: [],
    requests: [],
    acceptedRequests: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listsRef = useRef(lists);
  const inFlightRef = useRef<InFlightRefresh | null>(null);

  const runRefresh = useCallback(
    async (
      silent: boolean,
      scope: ExpertPanelRefreshScope,
    ): Promise<ExpertPanelRefreshResult | null> => {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      try {
        const prev = listsRef.current;
        let nextOffers: BackendOffer[] | undefined;
        let nextRequests: BackendRequest[] | undefined;
        let nextAccepted: BackendRequest[] | undefined;

        if (scope === "all") {
          // Fetch everything first, then commit atomically so the request never
          // disappears from offers before it appears in acceptedRequests.
          [nextOffers, nextRequests, nextAccepted] = await Promise.all([
            getExpertOffers(),
            getExpertRequests(),
            getAcceptedRequests(),
          ]);
          const next: PanelLists = {
            offers: nextOffers,
            requests: nextRequests,
            acceptedRequests: nextAccepted,
          };
          listsRef.current = next;
          setLists(next);
          console.log("[expert] GET /experts/me/offers", nextOffers);
          console.log("[expert] GET /experts/me/requests", nextRequests);
          console.log(
            "[expert] GET /experts/me/requests?status=accepted",
            nextAccepted,
          );
          return next;
        }

        if (scope === "offers") {
          nextOffers = await getExpertOffers();
          const next: PanelLists = { ...prev, offers: nextOffers };
          listsRef.current = next;
          setLists(next);
          console.log("[expert] GET /experts/me/offers", nextOffers);
          return next;
        }

        [nextRequests, nextAccepted] = await Promise.all([
          getExpertRequests(),
          getAcceptedRequests(),
        ]);
        const next: PanelLists = {
          ...prev,
          requests: nextRequests,
          acceptedRequests: nextAccepted,
        };
        listsRef.current = next;
        setLists(next);
        console.log("[expert] GET /experts/me/requests", nextRequests);
        console.log(
          "[expert] GET /experts/me/requests?status=accepted",
          nextAccepted,
        );
        return next;
      } catch (err) {
        if (!silent) {
          setError(
            err instanceof Error ? err.message : "Unable to load panel data.",
          );
        }
        return null;
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const refresh = useCallback(
    async (options?: ExpertPanelRefreshOptions) => {
      const silent = options?.silent ?? false;
      const scope = options?.scope ?? "all";

      const existing = inFlightRef.current;
      if (existing && scopeCovers(existing.scope, scope)) {
        // Reuse the in-flight fetch (Accept + socket onAccepted overlap).
        return existing.promise;
      }

      if (existing) {
        // Narrower/different scope is running — wait, then continue.
        await existing.promise;
        if (
          inFlightRef.current &&
          scopeCovers(inFlightRef.current.scope, scope)
        ) {
          return inFlightRef.current.promise;
        }
      }

      const promise = runRefresh(silent, scope);
      inFlightRef.current = { promise, scope };
      try {
        return await promise;
      } finally {
        if (inFlightRef.current?.promise === promise) {
          inFlightRef.current = null;
        }
      }
    },
    [runRefresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const { offers, requests, acceptedRequests } = lists;
  const nowMs = useDeadlineClock(15_000);

  const queueList = useStableIdList(
    useMemo(
      () => buildQueueList(offers, acceptedRequests, nowMs),
      [offers, acceptedRequests, nowMs],
    ),
    [offers, acceptedRequests],
    (item) => item.id,
  );

  const newRequestsList = useStableIdList(
    useMemo(
      () => buildNewRequestsList(offers, acceptedRequests, nowMs),
      [offers, acceptedRequests, nowMs],
    ),
    [offers, acceptedRequests],
    (offer) => normalizeMongoId(offer._id),
  );

  const draftsList = useStableIdList(
    useMemo(
      () => buildDraftsList(acceptedRequests, nowMs),
      [acceptedRequests, nowMs],
    ),
    [acceptedRequests],
    (request) => normalizeMongoId(request._id),
  );

  const navCounts = useMemo<ExpertNavCounts>(
    () => ({
      queue: queueList.length,
      drafts: draftsList.length,
    }),
    [queueList, draftsList],
  );

  const value = useMemo(
    () => ({
      offers,
      requests,
      acceptedRequests,
      queueList,
      newRequestsList,
      draftsList,
      isLoading,
      error,
      navCounts,
      refresh,
    }),
    [
      offers,
      requests,
      acceptedRequests,
      queueList,
      newRequestsList,
      draftsList,
      isLoading,
      error,
      navCounts,
      refresh,
    ],
  );

  return (
    <ExpertPanelDataContext.Provider value={value}>
      {children}
    </ExpertPanelDataContext.Provider>
  );
}

export function useExpertPanelData(): ExpertPanelDataContextValue {
  const ctx = useContext(ExpertPanelDataContext);
  if (!ctx) {
    throw new Error(
      "useExpertPanelData must be used within ExpertPanelDataProvider",
    );
  }
  return ctx;
}
