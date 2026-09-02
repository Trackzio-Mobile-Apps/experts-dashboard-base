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
 * Detection still uses accepted/history REST lists for same-session expiry.
 * Cross-device unseen offer / deadline events come from `GET /experts/me/inbox`.
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
