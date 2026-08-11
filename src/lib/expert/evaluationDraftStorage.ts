import type { EvaluationFormState } from "@/lib/expert/types";

const DRAFT_PREFIX = "coinzy_eval_draft_";
const REPORT_ID_PREFIX = "coinzy_eval_report_id_";

function notifyDraftNavChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: `${DRAFT_PREFIX}nav`,
    }),
  );
}

export function loadEvaluationDraft(requestId: string): EvaluationFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${requestId}`);
    if (!raw) return null;
    return JSON.parse(raw) as EvaluationFormState;
  } catch {
    return null;
  }
}

export function saveEvaluationDraft(
  requestId: string,
  form: EvaluationFormState,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${DRAFT_PREFIX}${requestId}`, JSON.stringify(form));
    notifyDraftNavChanged();
  } catch {
    // ignore storage errors
  }
}

/** Persist server report id so draft/submit can PUT after accept (API may omit reportId). */
export function loadEvaluationDraftReportId(requestId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${REPORT_ID_PREFIX}${requestId}`);
    return typeof raw === "string" && raw.trim() ? raw.trim() : null;
  } catch {
    return null;
  }
}

export function saveEvaluationDraftReportId(
  requestId: string,
  reportId: string,
): void {
  if (typeof window === "undefined") return;
  const id = reportId.trim();
  if (!id) return;
  try {
    localStorage.setItem(`${REPORT_ID_PREFIX}${requestId}`, id);
  } catch {
    // ignore storage errors
  }
}

export function clearEvaluationDraft(requestId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${DRAFT_PREFIX}${requestId}`);
  localStorage.removeItem(`${REPORT_ID_PREFIX}${requestId}`);
  notifyDraftNavChanged();
}
