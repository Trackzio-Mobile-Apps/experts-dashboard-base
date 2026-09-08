import { describe, expect, it } from "vitest";
import {
  planInboxReplay,
  unreadInboxIdsForRequest,
} from "@/lib/expert/inboxReplay";
import { mapBackendInboxItem } from "@/lib/expert/inboxService";
import type { BackendInboxItem, ExpertInboxItem } from "@/lib/expert/types";

function item(
  overrides: Partial<ExpertInboxItem> & Pick<ExpertInboxItem, "id" | "event">,
): ExpertInboxItem {
  return {
    offerId: "",
    requestId: "",
    round: null,
    expiresAt: null,
    isShown: false,
    isRead: false,
    isActive: true,
    createdAt: "2026-09-02T00:00:00.000Z",
    updatedAt: "2026-09-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("mapBackendInboxItem", () => {
  it("normalizes ids and payload from GET /experts/me/inbox", () => {
    const raw: BackendInboxItem = {
      _id: "507f1f77bcf86cd799439051",
      event: "request.offered",
      payload: {
        offerId: "507f1f77bcf86cd799439041",
        requestId: "507f1f77bcf86cd799439077",
        round: 1,
        expiresAt: "2026-06-24T00:00:00.000Z",
      },
      requestId: "507f1f77bcf86cd799439077",
      offerId: "507f1f77bcf86cd799439041",
      isShown: false,
      isRead: false,
      isActive: true,
      createdAt: "2026-06-22T00:00:00.000Z",
      updatedAt: "2026-06-22T00:00:00.000Z",
    };

    expect(mapBackendInboxItem(raw)).toEqual({
      id: "507f1f77bcf86cd799439051",
      event: "request.offered",
      offerId: "507f1f77bcf86cd799439041",
      requestId: "507f1f77bcf86cd799439077",
      round: 1,
      expiresAt: "2026-06-24T00:00:00.000Z",
      isShown: false,
      isRead: false,
      isActive: true,
      createdAt: "2026-06-22T00:00:00.000Z",
      updatedAt: "2026-06-22T00:00:00.000Z",
    });
  });

  it("treats missing isActive as active", () => {
    const mapped = mapBackendInboxItem({
      _id: "507f1f77bcf86cd799439051",
      event: "request.deadline_missed",
      payload: { requestId: "507f1f77bcf86cd799439077" },
    });
    expect(mapped?.isActive).toBe(true);
    expect(mapped?.requestId).toBe("507f1f77bcf86cd799439077");
  });
});

describe("planInboxReplay", () => {
  it("toasts unshown active offers and marks them shown", () => {
    const plan = planInboxReplay([
      item({
        id: "1",
        event: "request.offered",
        offerId: "offer-1",
        requestId: "req-1",
      }),
    ]);

    expect(plan.toasts).toHaveLength(1);
    expect(plan.toasts[0]?.kind).toBe("offer");
    expect(plan.toasts[0]?.message).toBe("1 new request in your queue");
    expect(plan.markShownIds).toEqual(["1"]);
  });

  it("skips live socket offers so the global live toast is not duplicated", () => {
    const plan = planInboxReplay(
      [
        item({
          id: "1",
          event: "request.offered",
          offerId: "offer-1",
          requestId: "req-1",
        }),
      ],
      { liveOfferIds: new Set(["offer-1"]) },
    );

    expect(plan.toasts).toEqual([]);
    expect(plan.markShownIds).toEqual(["1"]);
  });

  it("does not toast withdrawn offers; still marks them shown", () => {
    const plan = planInboxReplay([
      item({
        id: "1",
        event: "request.offered",
        offerId: "offer-1",
        isActive: false,
      }),
    ]);

    expect(plan.toasts).toEqual([]);
    expect(plan.markShownIds).toEqual(["1"]);
  });

  it("combines multiple deadline misses into one toast", () => {
    const plan = planInboxReplay(
      [
        item({
          id: "a",
          event: "request.deadline_missed",
          requestId: "req-a",
        }),
        item({
          id: "b",
          event: "request.deadline_missed",
          requestId: "req-b",
        }),
      ],
      {
        displayIdByRequestId: new Map([
          ["req-a", "16"],
          ["req-b", "17"],
        ]),
      },
    );

    expect(plan.toasts).toHaveLength(1);
    expect(plan.toasts[0]?.kind).toBe("deadline");
    expect(plan.toasts[0]?.message).toBe(
      "2 requests have expired and were moved to History.",
    );
    expect(plan.markShownIds).toEqual(["a", "b"]);
  });

  it("skips a toast when that request detail is already open", () => {
    const plan = planInboxReplay(
      [
        item({
          id: "1",
          event: "request.deadline_missed",
          requestId: "req-open",
        }),
      ],
      { openRequestId: "req-open" },
    );

    expect(plan.toasts).toEqual([]);
    expect(plan.markShownIds).toEqual(["1"]);
  });
});

describe("unreadInboxIdsForRequest", () => {
  it("returns unread rows for the open request", () => {
    const ids = unreadInboxIdsForRequest(
      [
        item({
          id: "1",
          event: "request.offered",
          requestId: "req-1",
          isRead: false,
          isShown: true,
        }),
        item({
          id: "2",
          event: "request.offered",
          requestId: "req-1",
          isRead: true,
        }),
        item({
          id: "3",
          event: "request.offered",
          requestId: "req-2",
        }),
      ],
      "req-1",
    );
    expect(ids).toEqual(["1"]);
  });
});
