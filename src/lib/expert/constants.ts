export const QUEUE_PAGE_SIZE = 5;
export const HISTORY_PAGE_SIZE = 5;
/** How often the queue home page polls for new offers (ms). */
export const QUEUE_POLL_INTERVAL_MS = 30_000;
/**
 * Session payload key (legacy). Expired notifications now use
 * `ExpiredRequestNotificationStore` / localStorage.
 */
export const DEADLINE_EXCEEDED_TOAST_KEY = "coinzy.expert.deadlineExceededToast";
/** Set after login — triggers the soonest due-soon evaluation reminder. */
export const EVALUATION_DUE_SOON_PROMPT_KEY =
  "coinzy.expert.showEvaluationDueSoonPrompt";
/** Reminder window: show due-soon popup only when ≤ this many hours remain. */
export const EVALUATION_DUE_SOON_HOURS = 24;
