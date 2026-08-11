import { createExpiredRequestNotificationStore } from "@/lib/expert/expiredRequestNotifications/createStore";
import { formatExpiredRequestToastMessage } from "@/lib/expert/expiredRequestNotifications/messages";
import {
  EXPIRED_REQUEST_NOTIFICATION_LIMIT,
  type ExpiredRequestNotification,
  type ExpiredRequestNotificationStore,
} from "@/lib/expert/expiredRequestNotifications/types";

type StoreFactory = (expertId: string) => ExpiredRequestNotificationStore;

/**
 * Application service over the store abstraction.
 * UI / toast queue depends on this — not on localStorage directly.
 */
export class ExpiredRequestNotificationService {
  constructor(
    private readonly createStore: StoreFactory = createExpiredRequestNotificationStore,
  ) {}

  private storeFor(expertId: string): ExpiredRequestNotificationStore {
    return this.createStore(expertId);
  }

  async recordExpired(
    expertId: string,
    notifications: ExpiredRequestNotification[],
  ): Promise<void> {
    if (!expertId.trim() || notifications.length === 0) return;
    await this.storeFor(expertId).recordExpiredRequests(notifications);
  }

  async recordExpiredRequest(
    expertId: string,
    notification: ExpiredRequestNotification,
  ): Promise<void> {
    await this.recordExpired(expertId, [notification]);
  }

  async getUnshown(
    expertId: string,
    limit = EXPIRED_REQUEST_NOTIFICATION_LIMIT,
  ): Promise<ExpiredRequestNotification[]> {
    if (!expertId.trim()) return [];
    return this.storeFor(expertId).getUnshownExpiredRequests(limit);
  }

  async markShown(expertId: string, requestIds: string[]): Promise<void> {
    if (!expertId.trim() || requestIds.length === 0) return;
    await this.storeFor(expertId).markAsShown(requestIds);
  }

  /**
   * Load unshown notifications and return toast message(s) to display.
   * Multiple unseen expiries collapse into ONE combined toast.
   * Marks only the included request IDs as seen.
   */
  async takeUnshownToastMessages(
    expertId: string,
    limit = EXPIRED_REQUEST_NOTIFICATION_LIMIT,
    options?: { excludeRequestIds?: string[] },
  ): Promise<{ message: string; requestIds: string[] }[]> {
    const exclude = new Set(
      (options?.excludeRequestIds ?? []).map((id) => id.trim()).filter(Boolean),
    );
    const unshown = (await this.getUnshown(expertId, limit)).filter(
      (item) => !exclude.has(item.requestId),
    );
    if (unshown.length === 0) return [];

    const message = formatExpiredRequestToastMessage(unshown);
    if (!message) return [];

    const requestIds = unshown.map((item) => item.requestId);
    await this.markShown(expertId, requestIds);

    return [{ message, requestIds }];
  }
}

let defaultService: ExpiredRequestNotificationService | null = null;

export function getExpiredRequestNotificationService(): ExpiredRequestNotificationService {
  if (!defaultService) {
    defaultService = new ExpiredRequestNotificationService();
  }
  return defaultService;
}

/** Test helper — inject a custom store factory. */
export function createExpiredRequestNotificationServiceForTests(
  createStore: StoreFactory,
): ExpiredRequestNotificationService {
  return new ExpiredRequestNotificationService(createStore);
}
