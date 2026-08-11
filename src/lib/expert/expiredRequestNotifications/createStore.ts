import { LocalExpiredRequestNotificationStore } from "@/lib/expert/expiredRequestNotifications/localStore";
import type { ExpiredRequestNotificationStore } from "@/lib/expert/expiredRequestNotifications/types";

/**
 * Factory for the active expired-notification store.
 * Today: localStorage. Later: return ApiExpiredRequestNotificationStore.
 */
export function createExpiredRequestNotificationStore(
  expertId: string,
): ExpiredRequestNotificationStore {
  const id = expertId.trim();
  if (!id) {
    // No expert — return a no-op local store with empty id (reads/writes no-op safely).
    return new LocalExpiredRequestNotificationStore("");
  }
  return new LocalExpiredRequestNotificationStore(id);
}
