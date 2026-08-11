import { describe, expect, it } from "vitest";
import { shouldOpenDeadlineExceededModal } from "@/lib/expert/deadlineExceededModal";

describe("shouldOpenDeadlineExceededModal", () => {
  it("opens immediately when the request is already expired (History / reload)", () => {
    expect(shouldOpenDeadlineExceededModal(true)).toBe(true);
  });

  it("does not open for a live non-expired request", () => {
    expect(shouldOpenDeadlineExceededModal(false)).toBe(false);
  });

  it("opens again on every evaluation of an already-expired request (reopen)", () => {
    // Remounting History → same helper result; no persisted “seen” flag.
    expect(shouldOpenDeadlineExceededModal(true)).toBe(true);
    expect(shouldOpenDeadlineExceededModal(true)).toBe(true);
  });

  it("opens when a live request later becomes expired", () => {
    expect(shouldOpenDeadlineExceededModal(false)).toBe(false);
    expect(shouldOpenDeadlineExceededModal(true)).toBe(true);
  });
});
