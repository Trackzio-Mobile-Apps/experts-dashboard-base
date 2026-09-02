import { describe, expect, it } from "vitest";
import { extractReportIdFromRequest } from "@/lib/expert/reportsService";
import { resolveReportCoinTitle } from "@/lib/expert/reportContentFields";
import { createInitialEvaluationFormState } from "@/lib/expert/evaluationForm";
import type { BackendRequest } from "@/lib/expert/types";

describe("extractReportIdFromRequest", () => {
  it("prefers submitted reportId over draftReportId", () => {
    const request = {
      _id: "req-1",
      status: "completed",
      reportId: "507f1f77bcf86cd799439099",
      draftReportId: "507f1f77bcf86cd799439088",
    } as BackendRequest;

    expect(extractReportIdFromRequest(request)).toBe(
      "507f1f77bcf86cd799439099",
    );
  });

  it("uses draftReportId when the submitted reportId is still null", () => {
    const request = {
      _id: "req-1",
      status: "accepted",
      reportId: null,
      draftReportId: "507f1f77bcf86cd799439088",
    } as BackendRequest;

    expect(extractReportIdFromRequest(request)).toBe(
      "507f1f77bcf86cd799439088",
    );
  });
});

describe("resolveReportCoinTitle", () => {
  it("falls back to the request coin name so draft POST can succeed", () => {
    const form = createInitialEvaluationFormState();
    expect(resolveReportCoinTitle(form, "Morgan Dollar")).toBe("Morgan Dollar");
  });
});
