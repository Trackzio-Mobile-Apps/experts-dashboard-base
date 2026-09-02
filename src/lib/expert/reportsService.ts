import { apiClient } from "@/lib/expert/apiClient";
import {
  evaluateFormProgress,
  normalizeEvaluationFormState,
  createInitialEvaluationFormState,
} from "@/lib/expert/evaluationForm";
import {
  loadEvaluationDraftReportId,
  saveEvaluationDraftReportId,
} from "@/lib/expert/evaluationDraftStorage";
import { normalizeMongoId } from "@/lib/expert/format";
import {
  contentFieldsToFormState,
  formToContentFields,
  resolveReportCoinTitle,
} from "@/lib/expert/reportContentFields";
import { getExpertRequests } from "@/lib/expert/requestsService";
import type {
  BackendReport,
  BackendRequest,
  EvaluationFormState,
  ExpertReportApiData,
  ReportContentFields,
  RequestMediaItem,
} from "@/lib/expert/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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

function rememberReportId(requestId: string, report: BackendReport): string | null {
  const id = normalizeMongoId(report._id);
  const reqId =
    normalizeMongoId(requestId) || normalizeMongoId(report.requestId);
  if (id && reqId) saveEvaluationDraftReportId(reqId, id);
  return id;
}

export async function lookupReportIdForRequest(
  requestId: string,
): Promise<string | null> {
  const normalizedRequestId = normalizeMongoId(requestId);
  if (!normalizedRequestId) return null;

  try {
    const requests = await getExpertRequests();
    const match = requests.find(
      (request) => normalizeMongoId(request._id) === normalizedRequestId,
    );
    const fromRequest = match ? extractReportIdFromRequest(match) : null;
    if (fromRequest) {
      saveEvaluationDraftReportId(normalizedRequestId, fromRequest);
      return fromRequest;
    }
  } catch {
    // fall through to local cache
  }

  const fromLocal = normalizeMongoId(
    loadEvaluationDraftReportId(normalizedRequestId) ?? "",
  );
  return fromLocal || null;
}

export async function createReport(
  requestId: string,
  options: ReportWritePayload,
) {
  const normalizedRequestId = normalizeMongoId(requestId);
  if (!normalizedRequestId) {
    throw new ExpertReportsError("Invalid request id.", 400);
  }

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

  if (status === 201 && envelope.data?.report) {
    rememberReportId(normalizedRequestId, envelope.data.report);
    return envelope.data;
  }

  if (status === 409 && envelope.data?.report) {
    rememberReportId(normalizedRequestId, envelope.data.report);
    throw new ExpertReportsError(
      envelope.message || "Report already exists for this request",
      409,
      envelope.data.report,
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

  const { status, envelope } = await apiClient.put<ReportMutationApiData>(
    `/experts/reports/${encodeURIComponent(normalizedReportId)}`,
    body,
    { skipAuthHandling: true },
  );

  if (envelope.error || !envelope.data?.report) {
    throw new ExpertReportsError(
      envelope.message || "Unable to update report.",
      status,
    );
  }

  if (options.requestId) {
    rememberReportId(options.requestId, envelope.data.report);
  } else {
    rememberReportId(envelope.data.report.requestId, envelope.data.report);
  }
  return envelope.data;
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

  let reportId = opts.reportId ? normalizeMongoId(opts.reportId) : null;
  if (!reportId) {
    reportId = await lookupReportIdForRequest(opts.requestId);
  }

  if (!reportId) {
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
      reportId =
        (err.existingReport
          ? normalizeMongoId(err.existingReport._id)
          : "") || (await lookupReportIdForRequest(opts.requestId));
      if (!reportId) throw err;
    }
  }

  const data = await updateReport(reportId, {
    requestId: opts.requestId,
    contentFields,
    attachments,
    isDraft: true,
    coinTitle,
  });
  return data.report;
}

export async function ensureDraftReport(opts: {
  requestId: string;
  reportId?: string | null;
  form?: EvaluationFormState;
  coinName?: string;
  attachments?: ReportAttachment[];
}): Promise<BackendReport> {
  let reportId = opts.reportId ? normalizeMongoId(opts.reportId) : null;
  if (!reportId) {
    reportId = await lookupReportIdForRequest(opts.requestId);
  }

  if (reportId) {
    const existing = await getReport(reportId);
    if (!isDraftReport(existing)) return existing;

    const form = opts.form ?? reportToFormState(existing);
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

  const form = opts.form ?? createInitialEvaluationFormState();
  return saveDraftReport({
    requestId: opts.requestId,
    form,
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

  const { status, envelope } = await apiClient.get<ExpertReportApiData>(
    `/experts/reports/${encodeURIComponent(normalizedReportId)}`,
    { skipAuthHandling: true },
  );

  if (envelope.error || !envelope.data?.report) {
    throw new ExpertReportsError(
      envelope.message || "Unable to load report.",
      status,
    );
  }

  return envelope.data.report;
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

type ReportForRequestOptions = {
  request?: BackendRequest;
  reportId?: string | null;
};

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

  const apiReportId =
    resolveReportIdForRequest(options) ||
    (await lookupReportIdForRequest(normalizedRequestId));
  if (!apiReportId) return null;

  try {
    return await getReport(apiReportId);
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
