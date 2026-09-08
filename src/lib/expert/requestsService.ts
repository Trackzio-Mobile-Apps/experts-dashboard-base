import { apiClient } from "@/lib/expert/apiClient";
import type { HistoryPeriodFilter } from "@/lib/expert/format";
import type {
  ExpertOffersApiData,
  ExpertRequestsApiData,
  RequestStatus,
} from "@/lib/expert/types";

export class ExpertRequestsError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ExpertRequestsError";
  }
}

export type GetExpertRequestsQuery = {
  statuses?: RequestStatus[];
  /** Inclusive lower bound on request `createdAt`, Unix ms. */
  createdAfter?: number;
  /** Exclusive upper bound on request `createdAt`, Unix ms. */
  createdBefore?: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Completed history rows — both statuses are valid “done” on the backend. */
export const HISTORY_COMPLETED_STATUSES: RequestStatus[] = [
  "completed",
  "report_submitted",
];

export function lastThirtyDaysCreatedAfter(nowMs = Date.now()): number {
  return Math.floor(nowMs - 30 * MS_PER_DAY);
}

export function lastCalendarMonthRange(nowMs = Date.now()): {
  createdAfter: number;
  createdBefore: number;
} {
  const now = new Date(nowMs);
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    createdAfter: start.getTime(),
    createdBefore: end.getTime(),
  };
}

export function historyPeriodRequestsQuery(
  period: HistoryPeriodFilter,
  nowMs = Date.now(),
): GetExpertRequestsQuery {
  if (period === "thisMonth") {
    const range = lastCalendarMonthRange(nowMs);
    return {
      statuses: [...HISTORY_COMPLETED_STATUSES],
      createdAfter: range.createdAfter,
      createdBefore: range.createdBefore,
    };
  }

  if (period === "month") {
    return {
      statuses: [...HISTORY_COMPLETED_STATUSES],
      createdAfter: lastThirtyDaysCreatedAfter(nowMs),
    };
  }

  if (period === "quarter") {
    return {
      statuses: [...HISTORY_COMPLETED_STATUSES],
      createdAfter: Math.floor(nowMs - 90 * MS_PER_DAY),
    };
  }

  return {};
}

export function buildExpertRequestsSearch(
  query: GetExpertRequestsQuery = {},
): string {
  const parts: string[] = [];
  for (const status of query.statuses ?? []) {
    const trimmed = status.trim();
    if (!trimmed) continue;
    parts.push(`status=${encodeURIComponent(trimmed)}`);
  }
  if (typeof query.createdAfter === "number" && Number.isFinite(query.createdAfter)) {
    parts.push(`createdAfter=${Math.floor(query.createdAfter)}`);
  }
  if (typeof query.createdBefore === "number" && Number.isFinite(query.createdBefore)) {
    parts.push(`createdBefore=${Math.floor(query.createdBefore)}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

function normalizeRequestsQuery(
  query?: RequestStatus[] | GetExpertRequestsQuery,
): GetExpertRequestsQuery {
  if (!query) return {};
  if (Array.isArray(query)) return { statuses: query };
  return query;
}

export async function getExpertOffers() {
  const { status, envelope } = await apiClient.get<ExpertOffersApiData>(
    "/experts/me/offers",
    { skipAuthHandling: true },
  );

  if (status === 401) {
    throw new ExpertRequestsError("Session expired.", 401);
  }

  if (envelope.error) {
    throw new ExpertRequestsError(
      envelope.message || "Unable to load offers.",
      status,
    );
  }

  return envelope.data?.offers ?? [];
}

export async function getExpertRequests(
  query?: RequestStatus[] | GetExpertRequestsQuery,
) {
  const search = buildExpertRequestsSearch(normalizeRequestsQuery(query));

  const { status, envelope } = await apiClient.get<ExpertRequestsApiData>(
    `/experts/me/requests${search}`,
    { skipAuthHandling: true },
  );

  if (status === 401) {
    throw new ExpertRequestsError("Session expired.", 401);
  }

  if (status === 400) {
    throw new ExpertRequestsError(
      envelope.message || "Invalid request filter.",
      400,
    );
  }

  if (envelope.error) {
    throw new ExpertRequestsError(
      envelope.message || "Unable to load requests.",
      status,
    );
  }

  return envelope.data?.requests ?? [];
}

export async function getAcceptedRequests() {
  return getExpertRequests(["accepted"]);
}
