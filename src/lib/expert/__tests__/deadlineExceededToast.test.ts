import { describe, expect, it } from "vitest";
import { formatDeadlineExceededToastMessage } from "@/lib/expert/deadlineExceededToast";
import { EXPIRED_REQUEST_DETAIL_MESSAGE } from "@/lib/expert/expiredRequestNotifications";

describe("formatDeadlineExceededToastMessage (legacy wrapper)", () => {
  it("formats a single expired request with REQ-ID label", () => {
    expect(formatDeadlineExceededToastMessage(["16"])).toBe(
      "Request REQ-ID 00016 has expired and was moved to History.",
    );
  });

  it("formats multiple expired requests with a count", () => {
    expect(formatDeadlineExceededToastMessage(["16", "17", "18"])).toBe(
      "3 requests have expired and were moved to History.",
    );
  });

  it("returns null for empty input", () => {
    expect(formatDeadlineExceededToastMessage([])).toBeNull();
  });
});

describe("EXPIRED_REQUEST_DETAIL_MESSAGE", () => {
  it("matches the required History / view-only copy", () => {
    expect(EXPIRED_REQUEST_DETAIL_MESSAGE).toBe(
      "This request has expired. You can no longer submit this evaluation.",
    );
  });
});
