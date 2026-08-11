import { describe, expect, it } from "vitest";
import {
  formatQueueDeadlineLabel,
  formatQueueRequestIdLabel,
  isDeadlineExceeded,
} from "@/lib/expert/format";
import { mapOfferToQueueItem } from "@/lib/expert/requestMappers";
import type { BackendOffer } from "@/lib/expert/types";

describe("isDeadlineExceeded", () => {
  it("returns true when now is at or after deadlineAt", () => {
    const nowMs = Date.parse("2026-08-06T12:00:00.000Z");
    expect(
      isDeadlineExceeded("2026-08-06T12:00:00.000Z", nowMs),
    ).toBe(true);
    expect(
      isDeadlineExceeded("2026-08-06T11:59:59.999Z", nowMs),
    ).toBe(true);
  });

  it("returns false when deadlineAt is still in the future", () => {
    const nowMs = Date.parse("2026-08-06T12:00:00.000Z");
    expect(
      isDeadlineExceeded("2026-08-06T12:00:01.000Z", nowMs),
    ).toBe(false);
  });
});

describe("formatQueueDeadlineLabel", () => {
  it("shows Expired when deadlineAt has passed", () => {
    const nowMs = Date.parse("2026-08-06T12:00:00.000Z");
    expect(
      formatQueueDeadlineLabel("2026-08-06T11:00:00.000Z", 0, nowMs),
    ).toBe("Expired");
  });

  it("shows day count when deadlineAt is still active", () => {
    const nowMs = Date.parse("2026-08-06T12:00:00.000Z");
    expect(
      formatQueueDeadlineLabel("2026-08-08T12:00:00.000Z", 2, nowMs),
    ).toBe("2 days");
  });
});

describe("formatQueueRequestIdLabel", () => {
  it("formats numeric display ids as REQ-ID with zero padding", () => {
    expect(formatQueueRequestIdLabel("16")).toBe("REQ-ID 00016");
    expect(formatQueueRequestIdLabel("00016")).toBe("REQ-ID 00016");
  });

  it("preserves EV- evaluation ids from the API", () => {
    expect(formatQueueRequestIdLabel("EV-KUBGCWV5")).toBe("EV-KUBGCWV5");
    expect(formatQueueRequestIdLabel("ev-kubgcwv5")).toBe("EV-KUBGCWV5");
  });

  it("maps REQ- prefixed ids to REQ-ID labels", () => {
    expect(formatQueueRequestIdLabel("REQ-00016")).toBe("REQ-ID 00016");
  });

  it("does not mangle alphanumeric ids into random digit tails", () => {
    expect(formatQueueRequestIdLabel("EV-KUBGCWV5")).not.toBe("REQ-ID GCWV5");
  });
});

describe("resolveDisplayId via mapOfferToQueueItem", () => {
  it("reads displayId from alternate API field names", () => {
    const offer = {
      _id: "offer1",
      request: {
        _id: "req1",
        display_id: "EV-TEST1234",
        status: "offered",
      },
    } as unknown as BackendOffer;

    expect(mapOfferToQueueItem(offer).displayId).toBe("EV-TEST1234");
  });

  it("coerces numeric displayId values", () => {
    const offer = {
      _id: "offer1",
      request: {
        _id: "req1",
        displayId: 16,
        status: "offered",
      },
    } as unknown as BackendOffer;

    expect(mapOfferToQueueItem(offer).displayId).toBe("16");
    expect(formatQueueRequestIdLabel(mapOfferToQueueItem(offer).displayId)).toBe(
      "REQ-ID 00016",
    );
  });

  it("uses the sooner of request deadline and offer expiry", () => {
    const offer = {
      _id: "offer1",
      expiresAt: "2026-08-05T12:00:00.000Z",
      request: {
        _id: "req1",
        displayId: "16",
        status: "offered",
        deadlineAt: "2026-08-10T12:00:00.000Z",
      },
    } as unknown as BackendOffer;

    const nowMs = Date.parse("2026-08-06T12:00:00.000Z");
    const item = mapOfferToQueueItem(offer);
    expect(item.deadlineAt).toBe("2026-08-05T12:00:00.000Z");
    expect(isDeadlineExceeded(item.deadlineAt, nowMs)).toBe(true);
  });
});
