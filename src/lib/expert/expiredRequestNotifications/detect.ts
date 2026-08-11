import { isDeadlineExceeded, normalizeMongoId } from "@/lib/expert/format";
import type { BackendRequest } from "@/lib/expert/types";
import type { ExpiredRequestNotification } from "@/lib/expert/expiredRequestNotifications/types";

function readDisplayId(request: BackendRequest): string | undefined {
  const record = request as Record<string, unknown>;
  for (const key of [
    "displayId",
    "display_id",
    "requestDisplayId",
    "request_display_id",
  ]) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

/**
 * True when a request should generate an expiry notification.
 * Covers:
 * - accepted / offered past `deadlineAt` (still in active lists)
 * - `deadline_missed` / `expired` (History / full requests after BE flips status)
 *
 * Reuses shared `isDeadlineExceeded` (same rule as Queue/Drafts).
 */
export function isAcceptedRequestExpiredForNotification(
  request: BackendRequest,
  nowMs = Date.now(),
): boolean {
  const status = request.status;
  if (
    status === "completed" ||
    status === "report_submitted" ||
    status === "cancelled"
  ) {
    return false;
  }

  if (status === "deadline_missed" || status === "expired") {
    return true;
  }

  // Accepted (or still listed) work past deadlineAt.
  if (status === "accepted" || status === "offered") {
    return isDeadlineExceeded(request.deadlineAt, nowMs);
  }

  // Other statuses: only if they still carry a past deadline (defensive).
  return isDeadlineExceeded(request.deadlineAt, nowMs);
}

export function toExpiredRequestNotification(
  request: BackendRequest,
  expiredAt = new Date().toISOString(),
): ExpiredRequestNotification | null {
  const requestId = normalizeMongoId(request._id);
  if (!requestId) return null;

  return {
    requestId,
    displayId: readDisplayId(request),
    expiredAt,
  };
}

export function collectExpiredRequestNotifications(
  requests: BackendRequest[],
  nowMs = Date.now(),
  expiredAt = new Date(nowMs).toISOString(),
): ExpiredRequestNotification[] {
  const out: ExpiredRequestNotification[] = [];
  const seen = new Set<string>();

  for (const request of requests) {
    if (!isAcceptedRequestExpiredForNotification(request, nowMs)) continue;
    const item = toExpiredRequestNotification(request, expiredAt);
    if (!item || seen.has(item.requestId)) continue;
    seen.add(item.requestId);
    out.push(item);
  }

  return out;
}
