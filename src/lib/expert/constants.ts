import { STORAGE_KEYS } from "@/config/appEnv";

export const QUEUE_PAGE_SIZE = 5;
export const HISTORY_PAGE_SIZE = 5;
/** How often the queue home page polls for new offers (ms). */
export const QUEUE_POLL_INTERVAL_MS = 30_000;
export const DEADLINE_EXCEEDED_TOAST_KEY = STORAGE_KEYS.deadlineExceededToast;
export const EVALUATION_DUE_SOON_PROMPT_KEY =
  STORAGE_KEYS.evaluationDueSoonPrompt;
export const LOGIN_SUCCESS_KEY = STORAGE_KEYS.loginSuccess;
/** Reminder window: show due-soon popup only when ≤ this many hours remain. */
export const EVALUATION_DUE_SOON_HOURS = 24;
