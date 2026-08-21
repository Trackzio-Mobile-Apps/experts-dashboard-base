import { getAppSlug } from "@/config/appEnv";

/** Persisted expired-request notification (frontend or future API). */
export type ExpiredRequestNotification = {
  requestId: string;
  displayId?: string;
  expiredAt: string;
  shownAt?: string;
};

/**
 * Storage/API boundary for expired-request notifications.
 * Swap Local → API without changing toast UI or queue logic.
 */
export interface ExpiredRequestNotificationStore {
  recordExpiredRequests(
    requests: ExpiredRequestNotification[],
  ): Promise<void>;

  getUnshownExpiredRequests(
    limit?: number,
  ): Promise<ExpiredRequestNotification[]>;

  markAsShown(requestIds: string[]): Promise<void>;
}

export const EXPIRED_REQUEST_NOTIFICATION_LIMIT = 3;

export function expiredRequestNotificationStorageKey(expertId: string): string {
  const id = expertId.trim();
  return `${getAppSlug()}.expert.expiredRequestNotifications:${id}:v1`;
}
