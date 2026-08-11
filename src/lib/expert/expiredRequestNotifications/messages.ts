import { formatQueueRequestIdLabel } from "@/lib/expert/format";
import type { ExpiredRequestNotification } from "@/lib/expert/expiredRequestNotifications/types";

/** Exact product copy for the expired-request detail / modal. */
export const EXPIRED_REQUEST_DETAIL_MESSAGE =
  "This request has expired. You can no longer submit this evaluation.";

/**
 * Single / plural toast copy for unseen expiry notifications.
 * 1 request → include REQ-ID label; 2+ → combined count only.
 */
export function formatExpiredRequestToastMessage(
  notifications: ExpiredRequestNotification[],
): string | null {
  if (notifications.length === 0) return null;

  if (notifications.length === 1) {
    const item = notifications[0]!;
    const label = formatQueueRequestIdLabel(
      item.displayId?.trim() || item.requestId,
    );
    return `Request ${label} has expired and was moved to History.`;
  }

  return `${notifications.length} requests have expired and were moved to History.`;
}
