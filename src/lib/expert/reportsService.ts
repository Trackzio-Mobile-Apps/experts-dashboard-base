import { apiClient } from "@/lib/expert/apiClient";
import {
  evaluateFormProgress,
  normalizeEvaluationFormState,
} from "@/lib/expert/evaluationForm";
import { saveEvaluationDraftReportId } from "@/lib/expert/evaluationDraftStorage";
import { normalizeMongoId } from "@/lib/expert/format";
import {
  contentFieldsToFormState,
  formToContentFields,
  resolveReportCoinTitle,
} from "@/lib/expert/reportContentFields";
import { getAcceptedRequests } from "@/lib/expert/requestsService";
import type {
  BackendReport,
  BackendRequest,
  EvaluationFormState,
  ExpertReportApiData,
  ExpertReportsListApiData,
  ReportContentFields,
  RequestMediaItem,
} from "@/lib/expert/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function logDraft(step: string, details?: Record<string, unknown>) {
  if (details) {
    console.log("[expert:draft]", step, details);
    return;
  }
  console.log("[expert:draft]", step);
}

function contentFieldsFilledKeys(
  fields: Partial<ReportContentFields> | undefined,
): string[] {
  if (!fields) return [];
  const filled: string[] = [];
  for (const [section, values] of Object.entries(fields)) {
    if (!values || typeof values !== "object") continue;
    for (const [key, value] of Object.entries(
      values as Record<string, unknown>,
    )) {
      if (typeof value === "string" && value.trim()) {
        filled.push(`${section}.${key}`);
      }
    }
  }
  return filled;
}

function reportIdFromUnknown(value: unknown): string | null {
  if (typeof value === "string") {
    const id = normalizeMongoId(value);
    return id || null;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const id = normalizeMongoId(record._id ?? record.id ?? record.reportId);
    return id || null;
  }
  return null;
}

export class ExpertReportsError extends Error {
  existingReport?: BackendReport;

  constructor(
    message: string,
    public readonly status: number,
    existingReport?: BackendReport,
  ) {
    super(message);
    this.name = "ExpertReportsError";
    this.existingReport = existingReport;
  }
}

export type ReportAttachment = {
  url: string;
  kind: "image" | "video";
  group?: string;
  alt?: string;
  poster?: string;
};

export type ReportWritePayload = {
  contentFields: Partial<ReportContentFields>;
  attachments?: ReportAttachment[];
  isDraft: boolean;
  coinTitle?: string;
};

type ReportMutationApiData = {
  report: BackendReport;
  request?: BackendRequest;
};

export function mediaToReportAttachments(
  media: RequestMediaItem[],
): ReportAttachment[] {
  const attachments: ReportAttachment[] = [];

  for (const item of media) {
    const url = typeof item.src === "string" ? item.src.trim() : "";
    if (!url) continue;

    if (item.kind === "video") {
      attachments.push({
        url,
        kind: "video",
        ...(item.group ? { group: item.group } : {}),
        ...(item.alt ? { alt: item.alt } : {}),
        ...(item.poster?.trim() ? { poster: item.poster.trim() } : {}),
      });
      continue;
    }

    attachments.push({
      url,
      kind: "image",
      ...(item.group ? { group: item.group } : {}),
      ...(item.alt ? { alt: item.alt } : {}),
    });
  }

  return attachments;
}

export function reportToFormState(report: BackendReport): EvaluationFormState {
  return normalizeEvaluationFormState(
    contentFieldsToFormState(report.contentFields, report.content),
  );
}

export function isDraftReport(report: BackendReport | null | undefined): boolean {
  if (!report) return false;
  if (report.isDraft === true) return true;
  if (report.isDraft === false) return false;
  return report.status === "draft";
}

export function isSubmittedReportConflict(
  message: string,
  report?: BackendReport | null,
): boolean {
  if (report) return !isDraftReport(report);
  return /already submitted/i.test(message);
}

function extractReportFromApiData(data: unknown): BackendReport | undefined {
  const record = asRecord(data);
  const candidates: unknown[] = [
    record.report,
    record.existingReport,
    data,
  ];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      continue;
    }
    const id = normalizeMongoId((candidate as { _id?: unknown })._id);
    if (id) return candidate as BackendReport;
  }
  return undefined;
}

function rememberReportId(requestId: string, report: BackendReport): string | null {
  const id = normalizeMongoId(report._id);
  const reqId =
    normalizeMongoId(requestId) || normalizeMongoId(report.requestId);
  if (id && reqId) saveEvaluationDraftReportId(reqId, id);
  return id;
}

type ReportForRequestOptions = {
  request?: BackendRequest;
  reportId?: string | null;
};

export function parseExpertReportsList(data: unknown): BackendReport[] {
  if (Array.isArray(data)) return data as BackendReport[];
  const record = asRecord(data);
  if (Array.isArray(record.reports)) return record.reports as BackendReport[];
  if (Array.isArray(record.items)) return record.items as BackendReport[];
  if (Array.isArray(record.docs)) return record.docs as BackendReport[];
  if (Array.isArray(record.report)) return record.report as BackendReport[];
  const nested = asRecord(record.data);
  if (Array.isArray(nested.reports)) return nested.reports as BackendReport[];
  if (Array.isArray(nested.items)) return nested.items as BackendReport[];
  return [];
}

export function extractRequestIdFromReport(
  report: BackendReport | Record<string, unknown>,
): string | null {
  const record = asRecord(report);
  return (
    normalizeMongoId(record.requestId) ||
    normalizeMongoId(record.request_id) ||
    reportIdFromUnknown(record.request) ||
    null
  );
}

export function matchReportIdForRequest(
  reports: BackendReport[],
  requestId: string,
): string | null {
  const normalizedRequestId = normalizeMongoId(requestId);
  if (!normalizedRequestId) return null;

  const isSameRequest = (report: BackendReport) =>
    extractRequestIdFromReport(report) === normalizedRequestId;

  const match =
    reports.find((report) => isSameRequest(report) && isDraftReport(report)) ??
    reports.find(isSameRequest);

  const matchedId = match ? normalizeMongoId(match._id) || null : null;
  logDraft("Array.find reports by requestId", {
    requestId: normalizedRequestId,
    reportCount: reports.length,
    matchedReportId: matchedId,
    isDraft: match ? isDraftReport(match) : null,
  });
  return matchedId;
}

let reportsListInflight: Promise<BackendReport[]> | null = null;

export async function getExpertReports(): Promise<BackendReport[]> {
  if (reportsListInflight) return reportsListInflight;

  reportsListInflight = (async () => {
    logDraft("call 2 GET /experts/reports");
    const { status, envelope } = await apiClient.get<
      ExpertReportsListApiData | BackendReport[]
    >("/experts/reports", { skipAuthHandling: true });

    const parsed = parseExpertReportsList(envelope.data);
    logDraft("call 2 GET /experts/reports response", {
      status,
      error: envelope.error,
      message: envelope.message,
      dataType: Array.isArray(envelope.data)
        ? "array"
        : envelope.data && typeof envelope.data === "object"
          ? Object.keys(asRecord(envelope.data))
          : typeof envelope.data,
      reportCount: parsed.length,
      requestIds: parsed.map((report) => extractRequestIdFromReport(report)),
      reportIds: parsed.map((report) => normalizeMongoId(report._id)),
    });

    if (status === 404) {
      logDraft("call 2 returned 404 — list unavailable, cannot Array.find");
      return [];
    }

    if (envelope.error) {
      throw new ExpertReportsError(
        envelope.message || "Unable to load reports.",
        status,
      );
    }

    return parsed;
  })();

  try {
    return await reportsListInflight;
  } finally {
    reportsListInflight = null;
  }
}

/**
 * Call 1: accepted request (`draftReportId` / `reportId` if present).
 * Call 2: GET /experts/reports + Array.find(report.requestId === request._id).
 * Call 3 (caller): GET /experts/reports/:id for contentFields.
 */
export async function lookupReportIdForRequest(
  requestId: string,
  options?: ReportForRequestOptions,
): Promise<string | null> {
  const normalizedRequestId = normalizeMongoId(requestId);
  if (!normalizedRequestId) return null;

  const fromOptions = resolveReportIdForRequest(options);
  if (fromOptions) {
    logDraft("call 1 skipped list — report id already on request", {
      requestId: normalizedRequestId,
      reportId: fromOptions,
    });
    saveEvaluationDraftReportId(normalizedRequestId, fromOptions);
    return fromOptions;
  }

  if (!options?.request) {
    try {
      logDraft("call 1 GET /experts/me/requests?status=accepted", {
        requestId: normalizedRequestId,
      });
      const accepted = await getAcceptedRequests();
      const match = accepted.find(
        (request) => normalizeMongoId(request._id) === normalizedRequestId,
      );
      const fromRequest = match ? extractReportIdFromRequest(match) : null;
      logDraft("call 1 accepted request match", {
        acceptedCount: accepted.length,
        foundRequest: Boolean(match),
        requestStatus: match?.status ?? null,
        draftReportId: match?.draftReportId ?? null,
        reportId: match?.reportId ?? null,
        fromRequest,
      });
      if (fromRequest) {
        saveEvaluationDraftReportId(normalizedRequestId, fromRequest);
        return fromRequest;
      }
    } catch (err) {
      logDraft("call 1 accepted requests failed — continuing to list", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  } else {
    logDraft("call 1 used provided request object", {
      requestId: normalizedRequestId,
      draftReportId: options.request.draftReportId ?? null,
      reportId: options.request.reportId ?? null,
    });
  }

  try {
    const reports = await getExpertReports();
    const fromList = matchReportIdForRequest(reports, normalizedRequestId);
    if (fromList) {
      saveEvaluationDraftReportId(normalizedRequestId, fromList);
      return fromList;
    }
    logDraft("call 2 no report matched this requestId", {
      requestId: normalizedRequestId,
    });
  } catch (err) {
    logDraft("call 2 GET /experts/reports failed", {
      message: err instanceof Error ? err.message : String(err),
      status: err instanceof ExpertReportsError ? err.status : undefined,
    });
    return null;
  }

  return null;
}

export async function createReport(
  requestId: string,
  options: ReportWritePayload,
) {
  const normalizedRequestId = normalizeMongoId(requestId);
  if (!normalizedRequestId) {
    throw new ExpertReportsError("Invalid request id.", 400);
  }

  logDraft("POST /experts/reports (first save)", {
    requestId: normalizedRequestId,
    isDraft: options.isDraft,
    coinTitle: options.coinTitle ?? null,
    filledKeys: contentFieldsFilledKeys(options.contentFields),
    attachmentCount: options.attachments?.length ?? 0,
  });

  const { status, envelope } = await apiClient.post<ReportMutationApiData>(
    "/experts/reports",
    {
      requestId: normalizedRequestId,
      contentFields: options.contentFields,
      attachments: options.attachments ?? [],
      isDraft: options.isDraft,
      ...(options.coinTitle ? { coinTitle: options.coinTitle } : {}),
    },
    { skipAuthHandling: true },
  );

  const report =
    extractReportFromApiData(envelope.data) ?? envelope.data?.report;
  logDraft("POST /experts/reports response", {
    status,
    error: envelope.error,
    message: envelope.message,
    reportId: report ? normalizeMongoId(report._id) : null,
    isDraft: report ? isDraftReport(report) : null,
    dataKeys:
      envelope.data && typeof envelope.data === "object"
        ? Object.keys(asRecord(envelope.data))
        : typeof envelope.data,
  });

  if ((status === 200 || status === 201) && report) {
    rememberReportId(normalizedRequestId, report);
    return {
      report,
      request: envelope.data?.request,
    };
  }

  if (status === 409) {
    const existing = extractReportFromApiData(envelope.data);
    if (existing) {
      rememberReportId(normalizedRequestId, existing);
    }
    throw new ExpertReportsError(
      envelope.message || "Report already exists for this request",
      409,
      existing,
    );
  }

  throw new ExpertReportsError(
    envelope.message ||
      (options.isDraft
        ? "Unable to save draft."
        : "Unable to submit report."),
    status,
  );
}

export async function updateReport(
  reportId: string,
  options: Partial<ReportWritePayload> & { requestId?: string },
) {
  const normalizedReportId = normalizeMongoId(reportId);
  if (!normalizedReportId) {
    throw new ExpertReportsError("Invalid report id.", 400);
  }

  const body: Record<string, unknown> = {};
  if (options.contentFields !== undefined) {
    body.contentFields = options.contentFields;
  }
  if (options.attachments !== undefined) {
    body.attachments = options.attachments;
  }
  if (options.isDraft !== undefined) body.isDraft = options.isDraft;
  if (options.coinTitle) body.coinTitle = options.coinTitle;

  logDraft("PUT /experts/reports/:id", {
    reportId: normalizedReportId,
    requestId: options.requestId ?? null,
    isDraft: options.isDraft,
    filledKeys: contentFieldsFilledKeys(options.contentFields),
    attachmentCount: options.attachments?.length,
  });

  const { status, envelope } = await apiClient.put<ReportMutationApiData>(
    `/experts/reports/${encodeURIComponent(normalizedReportId)}`,
    body,
    { skipAuthHandling: true },
  );

  const report =
    extractReportFromApiData(envelope.data) ?? envelope.data?.report;
  logDraft("PUT /experts/reports/:id response", {
    status,
    error: envelope.error,
    message: envelope.message,
    reportId: report ? normalizeMongoId(report._id) : null,
    isDraft: report ? isDraftReport(report) : null,
  });

  if (envelope.error || !report) {
    throw new ExpertReportsError(
      envelope.message || "Unable to update report.",
      status,
      extractReportFromApiData(envelope.data),
    );
  }

  if (options.requestId) {
    rememberReportId(options.requestId, report);
  } else {
    rememberReportId(report.requestId, report);
  }
  return { report, request: envelope.data?.request };
}

export async function saveDraftReport(opts: {
  requestId: string;
  reportId?: string | null;
  form: EvaluationFormState;
  coinName?: string;
  attachments?: ReportAttachment[];
}): Promise<BackendReport> {
  const attachments = opts.attachments ?? [];
  const coinTitle = resolveReportCoinTitle(opts.form, opts.coinName);
  const contentFields = formToContentFields(opts.form);
  if (!contentFields.generalInfo.coinName.trim()) {
    contentFields.generalInfo.coinName = coinTitle;
  }

  logDraft("saveDraftReport start", {
    requestId: opts.requestId,
    knownReportId: opts.reportId ?? null,
    filled: evaluateFormProgress(opts.form).filled,
    percent: evaluateFormProgress(opts.form).percent,
  });

  let reportId = opts.reportId ? normalizeMongoId(opts.reportId) : null;
  if (!reportId) {
    reportId = await lookupReportIdForRequest(opts.requestId);
    logDraft("saveDraftReport lookup after missing reportId", { reportId });
  }

  if (!reportId) {
    logDraft("saveDraftReport no report id — POST first draft");
    try {
      const data = await createReport(opts.requestId, {
        contentFields,
        attachments,
        isDraft: true,
        coinTitle,
      });
      return data.report;
    } catch (err) {
      if (!(err instanceof ExpertReportsError && err.status === 409)) {
        throw err;
      }
      const existing = err.existingReport;
      logDraft("saveDraftReport POST 409", {
        message: err.message,
        existingReportId: existing ? normalizeMongoId(existing._id) : null,
        existingIsDraft: existing ? isDraftReport(existing) : null,
      });
      if (existing && !isDraftReport(existing)) {
        rememberReportId(opts.requestId, existing);
        return existing;
      }
      reportId =
        (existing ? normalizeMongoId(existing._id) : "") ||
        (await lookupReportIdForRequest(opts.requestId));
      logDraft("saveDraftReport 409 recovered reportId", { reportId });
      if (!reportId) throw err;
    }
  }

  logDraft("saveDraftReport PUT existing draft", { reportId });
  try {
    const data = await updateReport(reportId, {
      requestId: opts.requestId,
      contentFields,
      attachments,
      isDraft: true,
      coinTitle,
    });
    return data.report;
  } catch (err) {
    if (
      err instanceof ExpertReportsError &&
      isSubmittedReportConflict(err.message, err.existingReport)
    ) {
      if (err.existingReport) {
        rememberReportId(opts.requestId, err.existingReport);
        return err.existingReport;
      }
      try {
        const submitted = await getReport(reportId);
        rememberReportId(opts.requestId, submitted);
        return submitted;
      } catch {
        throw err;
      }
    }
    throw err;
  }
}

export async function ensureDraftReport(opts: {
  requestId: string;
  reportId?: string | null;
  form?: EvaluationFormState;
  coinName?: string;
  attachments?: ReportAttachment[];
}): Promise<BackendReport | null> {
  let reportId = opts.reportId ? normalizeMongoId(opts.reportId) : null;
  if (!reportId) {
    reportId = await lookupReportIdForRequest(opts.requestId);
  }

  if (reportId) {
    const existing = await getReport(reportId);
    if (!isDraftReport(existing)) return existing;

    if (opts.form && evaluateFormProgress(opts.form).filled > 0) {
      return saveDraftReport({
        requestId: opts.requestId,
        reportId,
        form: opts.form,
        coinName: opts.coinName,
        attachments: opts.attachments,
      });
    }
    rememberReportId(opts.requestId, existing);
    return existing;
  }

  if (!opts.form || evaluateFormProgress(opts.form).filled === 0) {
    return null;
  }

  return saveDraftReport({
    requestId: opts.requestId,
    form: opts.form,
    coinName: opts.coinName,
    attachments: opts.attachments,
  });
}

export async function submitReport(
  requestId: string,
  options: {
    form: EvaluationFormState;
    attachments?: ReportAttachment[];
    reportId?: string | null;
  },
) {
  const attachments = options.attachments ?? [];
  const contentFields = formToContentFields(options.form);
  const coinTitle = resolveReportCoinTitle(options.form);

  let reportId = options.reportId ? normalizeMongoId(options.reportId) : null;
  if (!reportId) {
    reportId = await lookupReportIdForRequest(requestId);
  }

  if (reportId) {
    try {
      return await updateReport(reportId, {
        requestId,
        contentFields,
        attachments,
        isDraft: false,
        coinTitle,
      });
    } catch (err) {
      if (!(err instanceof ExpertReportsError && err.status === 404)) {
        throw err;
      }
    }
  }

  try {
    return await createReport(requestId, {
      contentFields,
      attachments,
      isDraft: false,
      coinTitle,
    });
  } catch (err) {
    if (!(err instanceof ExpertReportsError && err.status === 409)) {
      throw err;
    }
    const existingId =
      (err.existingReport ? normalizeMongoId(err.existingReport._id) : "") ||
      (await lookupReportIdForRequest(requestId));
    if (!existingId) throw err;
    return await updateReport(existingId, {
      requestId,
      contentFields,
      attachments,
      isDraft: false,
      coinTitle,
    });
  }
}

export async function getReport(reportId: string) {
  const normalizedReportId = normalizeMongoId(reportId);
  if (!normalizedReportId) {
    throw new ExpertReportsError("Invalid report id.", 400);
  }

  logDraft("call 3 GET /experts/reports/:id", {
    reportId: normalizedReportId,
  });
  const { status, envelope } = await apiClient.get<ExpertReportApiData>(
    `/experts/reports/${encodeURIComponent(normalizedReportId)}`,
    { skipAuthHandling: true },
  );

  const report =
    extractReportFromApiData(envelope.data) ?? envelope.data?.report;
  logDraft("call 3 GET /experts/reports/:id response", {
    status,
    error: envelope.error,
    message: envelope.message,
    reportId: report ? normalizeMongoId(report._id) : null,
    isDraft: report ? isDraftReport(report) : null,
    filledKeys: contentFieldsFilledKeys(report?.contentFields),
  });

  if (envelope.error || !report) {
    throw new ExpertReportsError(
      envelope.message || "Unable to load report.",
      status,
    );
  }

  return report;
}

export function extractReportIdFromRequest(
  request: BackendRequest,
): string | null {
  const fromSubmitted = normalizeMongoId(request.reportId);
  if (fromSubmitted) return fromSubmitted;

  const fromDraft = normalizeMongoId(request.draftReportId);
  if (fromDraft) return fromDraft;

  const embedded = reportIdFromUnknown(request.report);
  if (embedded) return embedded;

  const payload = asRecord(request.payload);
  for (const key of ["reportId", "report_id", "expertReportId", "draftReportId", "report"]) {
    const fromPayload = reportIdFromUnknown(payload[key]);
    if (fromPayload) return fromPayload;
  }

  return null;
}

function resolveReportIdForRequest(
  options?: ReportForRequestOptions,
): string | null {
  const explicit = options?.reportId
    ? normalizeMongoId(options.reportId)
    : null;
  if (explicit) return explicit;

  if (options?.request) {
    return extractReportIdFromRequest(options.request);
  }

  return null;
}

export async function getReportForRequest(
  requestId: string,
  options?: ReportForRequestOptions,
): Promise<BackendReport | null> {
  const normalizedRequestId = normalizeMongoId(requestId);
  if (!normalizedRequestId) return null;

  logDraft("getReportForRequest", {
    requestId: normalizedRequestId,
    optionReportId: options?.reportId ?? null,
  });
  const apiReportId = await lookupReportIdForRequest(
    normalizedRequestId,
    options,
  );
  if (!apiReportId) {
    logDraft("hydrate skipped call 3 — no report id for this request", {
      requestId: normalizedRequestId,
    });
    return null;
  }

  try {
    return await getReport(apiReportId);
  } catch (err) {
    if (!(err instanceof ExpertReportsError && err.status === 404)) {
      throw err;
    }
  }

  try {
    const reports = await getExpertReports();
    const listedId = matchReportIdForRequest(reports, normalizedRequestId);
    if (!listedId || listedId === apiReportId) return null;
    return await getReport(listedId);
  } catch (err) {
    if (err instanceof ExpertReportsError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function resolveReport(
  reportId?: string | null,
  requestId?: string | null,
  requestHint?: BackendRequest,
) {
  const normalizedRequestId = requestId
    ? normalizeMongoId(requestId)
    : normalizeMongoId(requestHint?._id);

  const urlReportId = reportId ? normalizeMongoId(reportId) : "";
  const apiReportId =
    urlReportId ||
    (requestHint ? extractReportIdFromRequest(requestHint) : null) ||
    "";

  if (apiReportId) {
    try {
      return await getReport(apiReportId);
    } catch (err) {
      if (
        !(err instanceof ExpertReportsError && err.status === 404) ||
        !normalizedRequestId
      ) {
        throw err;
      }
    }
  }

  if (normalizedRequestId) {
    const report = await getReportForRequest(normalizedRequestId, {
      request: requestHint,
    });
    if (report) return report;
  }

  throw new ExpertReportsError(
    normalizedRequestId || apiReportId
      ? "Unable to load report for this evaluation."
      : "Report reference is missing.",
    400,
  );
}

export function reportProgressPercent(report: BackendReport): number {
  const form = reportToFormState(report);
  return evaluateFormProgress(form).percent;
}

export { formToContentFields } from "@/lib/expert/reportContentFields";
