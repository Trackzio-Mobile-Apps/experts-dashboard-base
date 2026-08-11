/**
 * @deprecated Prefer `@/lib/expert/expiredRequestNotifications`.
 * Kept for message-format helpers used by existing tests during migration.
 */
import { formatExpiredRequestToastMessage } from "@/lib/expert/expiredRequestNotifications/messages";
import { formatQueueRequestIdLabel } from "@/lib/expert/format";

export type DeadlineExceededToastPayload = {
  displayIds: string[];
};

function uniqueDisplayIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids) {
    const id = raw.trim();
    if (!id) continue;
    const key = formatQueueRequestIdLabel(id).toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(id);
  }
  return out;
}

/** @deprecated Use formatExpiredRequestToastMessage */
export function formatDeadlineExceededToastMessage(
  displayIds: string[],
): string | null {
  const ids = uniqueDisplayIds(displayIds);
  return formatExpiredRequestToastMessage(
    ids.map((displayId) => ({
      requestId: displayId,
      displayId,
      expiredAt: new Date(0).toISOString(),
    })),
  );
}

/** @deprecated Persistence moved to ExpiredRequestNotificationService */
export function queueDeadlineExceededToast(_displayId: string): void {
  /* no-op — use ExpiredRequestNotificationService.recordExpiredRequest */
}

/** @deprecated */
export function consumeDeadlineExceededToastMessage(): string | null {
  return null;
}

/** @deprecated */
export function clearDeadlineExceededToastMessage(): void {
  /* no-op */
}

/** @deprecated */
export function resetDeadlineExceededToastStateForTests(): void {
  /* no-op */
}
