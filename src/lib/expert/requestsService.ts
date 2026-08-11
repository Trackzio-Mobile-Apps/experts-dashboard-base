import { apiClient } from "@/lib/expert/apiClient";
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

export async function getExpertRequests(statuses?: RequestStatus[]) {
  const params: Record<string, string> = {};
  const query = statuses?.length
    ? "?" + statuses.map((s) => `status=${encodeURIComponent(s)}`).join("&")
    : "";

  const { status, envelope } = await apiClient.get<ExpertRequestsApiData>(
    `/experts/me/requests${query}`,
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

export async function getCompletedRequests() {
  return getExpertRequests(["completed", "report_submitted"]);
}
