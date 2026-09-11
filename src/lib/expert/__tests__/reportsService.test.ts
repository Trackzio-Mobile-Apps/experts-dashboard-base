import { describe, expect, it } from "vitest";
import {
  extractReportIdFromRequest,
  isSubmittedReportConflict,
  matchReportIdForRequest,
  parseExpertReportsList,
} from "@/lib/expert/reportsService";
import { resolveReportCoinTitle } from "@/lib/expert/reportContentFields";
import { createInitialEvaluationFormState } from "@/lib/expert/evaluationForm";
import type { BackendReport, BackendRequest } from "@/lib/expert/types";

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

describe("parseExpertReportsList", () => {
  it("reads reports from the envelope data object", () => {
    const reports = [
      { _id: "507f1f77bcf86cd799439011", requestId: "req-1" },
    ] as BackendReport[];
    expect(parseExpertReportsList({ reports })).toEqual(reports);
  });

  it("accepts a bare reports array", () => {
    const reports = [
      { _id: "507f1f77bcf86cd799439011", requestId: "req-1" },
    ] as BackendReport[];
    expect(parseExpertReportsList(reports)).toEqual(reports);
  });
});

describe("matchReportIdForRequest", () => {
  const requestId = "507f1f77bcf86cd799439001";
  const draftId = "507f1f77bcf86cd799439088";
  const submittedId = "507f1f77bcf86cd799439099";

  it("matches report.requestId to the accepted request id", () => {
    const reports = [
      {
        _id: draftId,
        requestId,
        isDraft: true,
        status: "draft",
      },
    ] as BackendReport[];

    expect(matchReportIdForRequest(reports, requestId)).toBe(draftId);
  });

  it("prefers a draft when multiple reports share the request id", () => {
    const reports = [
      {
        _id: submittedId,
        requestId,
        isDraft: false,
        status: "submitted",
      },
      {
        _id: draftId,
        requestId,
        isDraft: true,
        status: "draft",
      },
    ] as BackendReport[];

    expect(matchReportIdForRequest(reports, requestId)).toBe(draftId);
  });

  it("returns null when no report exists for the request", () => {
    const reports = [
      {
        _id: draftId,
        requestId: "507f1f77bcf86cd799439002",
        isDraft: true,
        status: "draft",
      },
    ] as BackendReport[];

    expect(matchReportIdForRequest(reports, requestId)).toBeNull();
  });

  it("matches request id nested on report.request", () => {
    const reports = [
      {
        _id: draftId,
        request: { _id: requestId },
        isDraft: true,
        status: "draft",
      },
    ] as unknown as BackendReport[];

    expect(matchReportIdForRequest(reports, requestId)).toBe(draftId);
  });
});

describe("isSubmittedReportConflict", () => {
  it("detects an already-submitted 409", () => {
    expect(
      isSubmittedReportConflict("Report already submitted for this request"),
    ).toBe(true);
    expect(isSubmittedReportConflict("Unable to save draft.")).toBe(false);
  });

  it("does not treat a draft 409 as submitted", () => {
    const draft = {
      _id: "507f1f77bcf86cd799439088",
      requestId: "507f1f77bcf86cd799439001",
      isDraft: true,
      status: "draft",
    } as BackendReport;
    expect(
      isSubmittedReportConflict(
        "Report already submitted for this request",
        draft,
      ),
    ).toBe(false);
  });
});

describe("resolveReportCoinTitle", () => {
  it("falls back to the request coin name so draft POST can succeed", () => {
    const form = createInitialEvaluationFormState();
    expect(resolveReportCoinTitle(form, "Morgan Dollar")).toBe("Morgan Dollar");
  });
});
