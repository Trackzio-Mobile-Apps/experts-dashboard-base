import { describe, expect, it } from "vitest";
import {
  buildExpertRequestsSearch,
  historyPeriodRequestsQuery,
  lastCalendarMonthRange,
  lastThirtyDaysCreatedAfter,
} from "@/lib/expert/requestsService";

describe("buildExpertRequestsSearch", () => {
  it("repeats status and sends createdAfter as unix ms", () => {
    expect(
      buildExpertRequestsSearch({
        statuses: ["completed", "report_submitted"],
        createdAfter: 1754730000000,
      }),
    ).toBe(
      "?status=completed&status=report_submitted&createdAfter=1754730000000",
    );
  });

  it("sends a calendar-month range with createdBefore", () => {
    expect(
      buildExpertRequestsSearch({
        statuses: ["completed"],
        createdAfter: 1756684800000,
        createdBefore: 1759363200000,
      }),
    ).toBe(
      "?status=completed&createdAfter=1756684800000&createdBefore=1759363200000",
    );
  });
});

describe("historyPeriodRequestsQuery", () => {
  const nowMs = Date.parse("2026-09-08T12:00:00.000Z");

  it("uses last 30 days createdAfter for the month tab", () => {
    const query = historyPeriodRequestsQuery("month", nowMs);
    expect(query.statuses).toEqual(["completed", "report_submitted"]);
    expect(query.createdAfter).toBe(lastThirtyDaysCreatedAfter(nowMs));
    expect(query.createdBefore).toBeUndefined();
    expect(nowMs - (query.createdAfter ?? 0)).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("uses last 90 days createdAfter for the quarter tab", () => {
    const query = historyPeriodRequestsQuery("quarter", nowMs);
    expect(query.statuses).toEqual(["completed", "report_submitted"]);
    expect(query.createdAfter).toBe(nowMs - 90 * 24 * 60 * 60 * 1000);
  });

  it("loads all assigned history with no date filter for all time", () => {
    expect(historyPeriodRequestsQuery("all", nowMs)).toEqual({});
  });
});

describe("lastCalendarMonthRange", () => {
  it("uses local calendar month start and exclusive next-month start", () => {
    const nowMs = Date.parse("2026-09-08T12:00:00.000Z");
    const range = lastCalendarMonthRange(nowMs);
    const start = new Date(2026, 8, 1).getTime();
    const end = new Date(2026, 9, 1).getTime();
    expect(range).toEqual({
      createdAfter: start,
      createdBefore: end,
    });
  });
});
