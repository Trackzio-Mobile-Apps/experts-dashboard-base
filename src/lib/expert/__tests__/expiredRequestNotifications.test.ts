import { beforeEach, describe, expect, it } from "vitest";
import {
  collectExpiredRequestNotifications,
  createExpiredRequestNotificationServiceForTests,
  createExpiredRequestNotificationStore,
  expiredRequestNotificationStorageKey,
  formatExpiredRequestToastMessage,
  LocalExpiredRequestNotificationStore,
  MemoryExpiredRequestNotificationStore,
} from "@/lib/expert/expiredRequestNotifications";
import type { BackendRequest } from "@/lib/expert/types";

describe("formatExpiredRequestToastMessage", () => {
  it("formats a single expired request with required product copy", () => {
    expect(
      formatExpiredRequestToastMessage([
        {
          requestId: "abc",
          displayId: "16",
          expiredAt: "2026-08-09T00:00:00.000Z",
        },
      ]),
    ).toBe("Request REQ-ID 00016 has expired and was moved to History.");
  });

  it("formats multiple expired requests as one combined count toast", () => {
    expect(
      formatExpiredRequestToastMessage([
        {
          requestId: "a",
          displayId: "1",
          expiredAt: "2026-08-09T00:00:00.000Z",
        },
        {
          requestId: "b",
          displayId: "2",
          expiredAt: "2026-08-09T00:00:01.000Z",
        },
        {
          requestId: "c",
          displayId: "3",
          expiredAt: "2026-08-09T00:00:02.000Z",
        },
      ]),
    ).toBe("3 requests have expired and were moved to History.");
  });
});

describe("collectExpiredRequestNotifications", () => {
  const nowMs = Date.parse("2026-08-09T12:00:00.000Z");

  it("records expired accepted requests", () => {
    const requests = [
      {
        _id: "req1",
        displayId: "16",
        status: "accepted",
        deadlineAt: "2026-08-09T11:00:00.000Z",
      },
      {
        _id: "req2",
        displayId: "17",
        status: "accepted",
        deadlineAt: "2026-08-10T12:00:00.000Z",
      },
    ] as unknown as BackendRequest[];

    const items = collectExpiredRequestNotifications(requests, nowMs);
    expect(items).toHaveLength(1);
    expect(items[0]?.requestId).toBe("req1");
    expect(items[0]?.displayId).toBe("16");
  });

  it("treats deadline_missed status as expired (History / full requests)", () => {
    const requests = [
      {
        _id: "req1",
        displayId: "16",
        status: "deadline_missed",
        deadlineAt: "2026-08-10T12:00:00.000Z",
      },
    ] as unknown as BackendRequest[];

    expect(collectExpiredRequestNotifications(requests, nowMs)).toHaveLength(1);
  });

  it("detects expired status from full requests after login", () => {
    const requests = [
      {
        _id: "req1",
        displayId: "16",
        status: "expired",
        deadlineAt: "2026-08-01T12:00:00.000Z",
      },
      {
        _id: "req2",
        displayId: "17",
        status: "completed",
        deadlineAt: "2026-08-01T12:00:00.000Z",
      },
    ] as unknown as BackendRequest[];

    const items = collectExpiredRequestNotifications(requests, nowMs);
    expect(items).toHaveLength(1);
    expect(items[0]?.requestId).toBe("req1");
  });
});

describe("LocalExpiredRequestNotificationStore", () => {
  const expertA = "expert-a";
  const expertB = "expert-b";

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("records expiry and dedupes by requestId", async () => {
    const store = new LocalExpiredRequestNotificationStore(expertA);
    await store.recordExpiredRequests([
      {
        requestId: "req1",
        displayId: "16",
        expiredAt: "2026-08-09T10:00:00.000Z",
      },
      {
        requestId: "req1",
        displayId: "16",
        expiredAt: "2026-08-09T11:00:00.000Z",
      },
    ]);

    const unshown = await store.getUnshownExpiredRequests();
    expect(unshown).toHaveLength(1);
    expect(unshown[0]?.requestId).toBe("req1");
  });

  it("keeps only the latest 3 requests", async () => {
    const store = new LocalExpiredRequestNotificationStore(expertA);
    await store.recordExpiredRequests([
      {
        requestId: "req1",
        displayId: "1",
        expiredAt: "2026-08-09T01:00:00.000Z",
      },
      {
        requestId: "req2",
        displayId: "2",
        expiredAt: "2026-08-09T02:00:00.000Z",
      },
      {
        requestId: "req3",
        displayId: "3",
        expiredAt: "2026-08-09T03:00:00.000Z",
      },
      {
        requestId: "req4",
        displayId: "4",
        expiredAt: "2026-08-09T04:00:00.000Z",
      },
    ]);

    const unshown = await store.getUnshownExpiredRequests(10);
    expect(unshown.map((item) => item.requestId)).toEqual([
      "req4",
      "req3",
      "req2",
    ]);
  });

  it("does not crash on malformed localStorage", async () => {
    window.localStorage.setItem(
      expiredRequestNotificationStorageKey(expertA),
      "{not-json",
    );
    const store = new LocalExpiredRequestNotificationStore(expertA);
    await expect(store.getUnshownExpiredRequests()).resolves.toEqual([]);
  });

  it("does not show already-shown requests again", async () => {
    const store = new LocalExpiredRequestNotificationStore(expertA);
    await store.recordExpiredRequests([
      {
        requestId: "req1",
        displayId: "16",
        expiredAt: "2026-08-09T10:00:00.000Z",
      },
    ]);
    await store.markAsShown(["req1"]);
    await expect(store.getUnshownExpiredRequests()).resolves.toEqual([]);
  });

  it("namespaces storage by expert id", async () => {
    const storeA = new LocalExpiredRequestNotificationStore(expertA);
    const storeB = new LocalExpiredRequestNotificationStore(expertB);

    await storeA.recordExpiredRequests([
      {
        requestId: "req1",
        displayId: "16",
        expiredAt: "2026-08-09T10:00:00.000Z",
      },
    ]);

    await expect(storeB.getUnshownExpiredRequests()).resolves.toEqual([]);
    await expect(storeA.getUnshownExpiredRequests()).resolves.toHaveLength(1);
  });

  it("does not access localStorage when expert id is empty (SSR-safe no-op)", async () => {
    const store = new LocalExpiredRequestNotificationStore("");
    await store.recordExpiredRequests([
      {
        requestId: "req1",
        expiredAt: "2026-08-09T10:00:00.000Z",
      },
    ]);
    expect(window.localStorage.length).toBe(0);
  });
});

describe("ExpiredRequestNotificationService", () => {
  it("emits one combined toast for multiple unshown expiries and marks them seen", async () => {
    const memory = new MemoryExpiredRequestNotificationStore();
    const service = createExpiredRequestNotificationServiceForTests(
      () => memory,
    );

    await service.recordExpired("expert-1", [
      {
        requestId: "req1",
        displayId: "16",
        expiredAt: "2026-08-09T10:00:00.000Z",
      },
      {
        requestId: "req2",
        displayId: "17",
        expiredAt: "2026-08-09T11:00:00.000Z",
      },
      {
        requestId: "req3",
        displayId: "18",
        expiredAt: "2026-08-09T12:00:00.000Z",
      },
    ]);

    const first = await service.takeUnshownToastMessages("expert-1");
    expect(first).toHaveLength(1);
    expect(first[0]?.message).toBe(
      "3 requests have expired and were moved to History.",
    );
    expect(first[0]?.requestIds).toEqual(["req3", "req2", "req1"]);

    const second = await service.takeUnshownToastMessages("expert-1");
    expect(second).toEqual([]);
  });

  it("Go Back / re-record does not create duplicate unshown toasts", async () => {
    const memory = new MemoryExpiredRequestNotificationStore();
    const service = createExpiredRequestNotificationServiceForTests(
      () => memory,
    );

    const payload = {
      requestId: "req1",
      displayId: "16",
      expiredAt: "2026-08-09T10:00:00.000Z",
    };

    await service.recordExpiredRequest("expert-1", payload);
    await service.recordExpiredRequest("expert-1", payload);

    const toasts = await service.takeUnshownToastMessages("expert-1");
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.message).toContain("Request REQ-ID 00016 has expired");

    await service.recordExpiredRequest("expert-1", payload);
    await expect(service.takeUnshownToastMessages("expert-1")).resolves.toEqual(
      [],
    );
  });

  it("excludes an open request id from toast flush (modal owns that UX)", async () => {
    const memory = new MemoryExpiredRequestNotificationStore();
    const service = createExpiredRequestNotificationServiceForTests(
      () => memory,
    );

    await service.recordExpired("expert-1", [
      {
        requestId: "open-req",
        displayId: "16",
        expiredAt: "2026-08-09T10:00:00.000Z",
      },
      {
        requestId: "other-req",
        displayId: "17",
        expiredAt: "2026-08-09T11:00:00.000Z",
      },
    ]);

    const toasts = await service.takeUnshownToastMessages("expert-1", 3, {
      excludeRequestIds: ["open-req"],
    });
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.requestIds).toEqual(["other-req"]);
    expect(toasts[0]?.message).toContain("Request REQ-ID 00017 has expired");

    const remaining = await service.getUnshown("expert-1");
    expect(remaining.map((item) => item.requestId)).toEqual(["open-req"]);
  });

  it("factory returns a store that implements the interface", async () => {
    const store = createExpiredRequestNotificationStore("expert-x");
    expect(typeof store.recordExpiredRequests).toBe("function");
    expect(typeof store.getUnshownExpiredRequests).toBe("function");
    expect(typeof store.markAsShown).toBe("function");
  });
});
