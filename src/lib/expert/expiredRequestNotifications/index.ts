export type {
  ExpiredRequestNotification,
  ExpiredRequestNotificationStore,
} from "@/lib/expert/expiredRequestNotifications/types";
export {
  EXPIRED_REQUEST_NOTIFICATION_LIMIT,
  expiredRequestNotificationStorageKey,
} from "@/lib/expert/expiredRequestNotifications/types";
export { createExpiredRequestNotificationStore } from "@/lib/expert/expiredRequestNotifications/createStore";
export {
  LocalExpiredRequestNotificationStore,
  MemoryExpiredRequestNotificationStore,
} from "@/lib/expert/expiredRequestNotifications/localStore";
export { formatExpiredRequestToastMessage, EXPIRED_REQUEST_DETAIL_MESSAGE } from "@/lib/expert/expiredRequestNotifications/messages";

/**
 * Backend limitations (FE cannot fix without API support):
 * 1. BE must flip status to `deadline_missed` / `expired` so History lists the request.
 * 2. Cross-device / cross-browser unseen expiry needs a server notification store.
 * 3. If an expiry never appears in `acceptedRequests` or `requests` after login,
 *    the FE cannot invent a notification from missing data.
 */
export {
  collectExpiredRequestNotifications,
  isAcceptedRequestExpiredForNotification,
  toExpiredRequestNotification,
} from "@/lib/expert/expiredRequestNotifications/detect";
export {
  ExpiredRequestNotificationService,
  createExpiredRequestNotificationServiceForTests,
  getExpiredRequestNotificationService,
} from "@/lib/expert/expiredRequestNotifications/service";
