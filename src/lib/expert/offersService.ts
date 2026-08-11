import { apiClient } from "@/lib/expert/apiClient";
import { normalizeMongoId } from "@/lib/expert/format";
import type { BackendOffer, BackendRequest } from "@/lib/expert/types";

type AcceptOfferApiData = {
  request: BackendRequest;
  offer: BackendOffer;
};

export class ExpertOffersError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ExpertOffersError";
  }
}

export type OfferAction = "accept" | "skip";

/** Map raw API offer errors to expert-facing copy. */
export function formatOfferErrorMessage(
  rawMessage: string,
  status: number,
  action: OfferAction,
): { message: string; markUnavailable: boolean } {
  const message = rawMessage.trim();
  const lower = message.toLowerCase();

  if (/workload\s*limit/i.test(message)) {
    return {
      message:
        "You have reached your active case limit. Finish or submit an in-progress evaluation before accepting another request.",
      markUnavailable: false,
    };
  }

  if (
    /not in acceptable state|not in accepted state|invalid state|no longer offered|offer expired|offer is expired|expired offer/i.test(
      lower,
    )
  ) {
    return {
      message:
        "This offer is no longer available. It may have expired or already been assigned. Return to the queue for current requests.",
      markUnavailable: true,
    };
  }

  if (
    /already accepted|already taken|unavailable|not found|another expert|taken by/i.test(
      lower,
    ) ||
    status === 404
  ) {
    return {
      message:
        "Another expert has already accepted this request, or it is no longer in your queue.",
      markUnavailable: true,
    };
  }

  if (action === "accept" && status === 409) {
    return {
      message:
        "Unable to accept this offer right now. Refresh the queue and try again.",
      markUnavailable: false,
    };
  }

  if (action === "skip" && status === 409) {
    return {
      message:
        "This offer can only be skipped before you accept it. Refresh the queue and try again.",
      markUnavailable: false,
    };
  }

  return {
    message:
      message ||
      (action === "accept"
        ? "Unable to accept offer."
        : "Unable to skip offer."),
    markUnavailable: false,
  };
}

export async function acceptOffer(offerId: string) {
  const normalizedId = normalizeMongoId(offerId);
  if (!normalizedId) {
    throw new ExpertOffersError("Invalid offer id.", 400);
  }

  const { status, envelope } = await apiClient.post<AcceptOfferApiData>(
    `/experts/offers/${encodeURIComponent(normalizedId)}/accept`,
    undefined,
    { skipAuthHandling: true },
  );

  if (envelope.error || !envelope.data?.request) {
    throw new ExpertOffersError(
      envelope.message || "Unable to accept offer.",
      status,
    );
  }

  return envelope.data;
}

export async function skipOffer(offerId: string) {
  const normalizedId = normalizeMongoId(offerId);
  if (!normalizedId) {
    throw new ExpertOffersError("Invalid offer id.", 400);
  }

  const { status, envelope } = await apiClient.post<{ offer: BackendOffer }>(
    `/experts/offers/${encodeURIComponent(normalizedId)}/skip`,
    undefined,
    { skipAuthHandling: true },
  );

  if (envelope.error) {
    throw new ExpertOffersError(
      envelope.message || "Unable to skip offer.",
      status,
    );
  }

  return envelope.data?.offer ?? null;
}
