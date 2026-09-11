import { STORAGE_KEYS } from "@/config/appEnv";

export const QUEUE_PAGE_SIZE = 5;
export const HISTORY_PAGE_SIZE = 5;
/** How often the queue home page polls for new offers (ms). */
export const QUEUE_POLL_INTERVAL_MS = 30_000;
export const DEADLINE_EXCEEDED_TOAST_KEY = STORAGE_KEYS.deadlineExceededToast;
export const EVALUATION_DUE_SOON_PROMPT_KEY =
  STORAGE_KEYS.evaluationDueSoonPrompt;
export const LOGIN_SUCCESS_KEY = STORAGE_KEYS.loginSuccess;
export const SUBMIT_SUCCESS_KEY = STORAGE_KEYS.submitSuccess;
export const SUBMIT_SUCCESS_EVENT = "expert:submit-success";
export const SUBMIT_SUCCESS_TOAST_MS = 4000;

export function markEvaluationSubmitSuccess() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SUBMIT_SUCCESS_KEY, "1");
  } catch {
    // sessionStorage can be unavailable in private browsing
  }
  window.dispatchEvent(new Event(SUBMIT_SUCCESS_EVENT));
}

export function clearEvaluationSubmitSuccess() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SUBMIT_SUCCESS_KEY);
  } catch {
    // ignore
  }
}

export function hasEvaluationSubmitSuccess(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SUBMIT_SUCCESS_KEY) === "1";
  } catch {
    return false;
  }
}
/** Reminder window: show due-soon popup only when ≤ this many hours remain. */
export const EVALUATION_DUE_SOON_HOURS = 24;
