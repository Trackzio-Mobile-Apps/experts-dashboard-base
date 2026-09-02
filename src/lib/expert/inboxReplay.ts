import { formatExpiredRequestToastMessage } from "@/lib/expert/expiredRequestNotifications/messages";
import { formatQueueRequestIdLabel } from "@/lib/expert/format";
import type { ExpertInboxItem } from "@/lib/expert/types";

const INBOX_EVENT_OFFERED = "request.offered";
const INBOX_EVENT_DEADLINE_MISSED = "request.deadline_missed";

export type InboxReplayToast = {
  kind: "offer" | "deadline";
  title?: string;
  message: string;
  itemIds: string[];
  requestIds: string[];
};

export type InboxReplayPlan = {
  toasts: InboxReplayToast[];
  markShownIds: string[];
};

export function planInboxReplay(
  items: ExpertInboxItem[],
  options: {
    openRequestId?: string | null;
    liveOfferIds?: Set<string>;
    liveDeadlineRequestIds?: Set<string>;
    displayIdByRequestId?: Map<string, string>;
  } = {},
): InboxReplayPlan {
  const openRequestId = options.openRequestId?.trim() || "";
  const liveOfferIds = options.liveOfferIds ?? new Set<string>();
  const liveDeadlineRequestIds =
    options.liveDeadlineRequestIds ?? new Set<string>();
  const displayIdByRequestId = options.displayIdByRequestId ?? new Map();

  const markShownIds: string[] = [];
  const offerToastItems: ExpertInboxItem[] = [];
  const deadlineToastItems: ExpertInboxItem[] = [];

  for (const item of items) {
    if (item.isShown) continue;

    const matchesOpenRequest =
      Boolean(openRequestId) && item.requestId === openRequestId;

    if (item.event === INBOX_EVENT_OFFERED) {
      const live = Boolean(item.offerId && liveOfferIds.has(item.offerId));
      if (!item.isActive || matchesOpenRequest || live) {
        markShownIds.push(item.id);
        continue;
      }
      offerToastItems.push(item);
      continue;
    }

    if (item.event === INBOX_EVENT_DEADLINE_MISSED) {
      const live =
        Boolean(item.requestId) &&
        liveDeadlineRequestIds.has(item.requestId);
      if (matchesOpenRequest || live) {
        markShownIds.push(item.id);
        continue;
      }
      deadlineToastItems.push(item);
      continue;
    }

    markShownIds.push(item.id);
  }

  const toasts: InboxReplayToast[] = [];

  if (offerToastItems.length > 0) {
    const count = offerToastItems.length;
    toasts.push({
      kind: "offer",
      title: "New request",
      message:
        count === 1
          ? "1 new request in your queue"
          : `${count} new requests in your queue`,
      itemIds: offerToastItems.map((item) => item.id),
      requestIds: offerToastItems
        .map((item) => item.requestId)
        .filter(Boolean),
    });
    markShownIds.push(...offerToastItems.map((item) => item.id));
  }

  if (deadlineToastItems.length > 0) {
    const notifications = deadlineToastItems.map((item) => ({
      requestId: item.requestId,
      displayId:
        displayIdByRequestId.get(item.requestId) ||
        formatQueueRequestIdLabel(item.requestId),
      expiredAt: item.createdAt ?? new Date().toISOString(),
    }));
    const message = formatExpiredRequestToastMessage(notifications);
    if (message) {
      toasts.push({
        kind: "deadline",
        message,
        itemIds: deadlineToastItems.map((item) => item.id),
        requestIds: deadlineToastItems
          .map((item) => item.requestId)
          .filter(Boolean),
      });
    }
    markShownIds.push(...deadlineToastItems.map((item) => item.id));
  }

  return {
    toasts,
    markShownIds: [...new Set(markShownIds)],
  };
}

export function unreadInboxIdsForRequest(
  items: ExpertInboxItem[],
  requestId: string,
): string[] {
  const id = requestId.trim();
  if (!id) return [];
  return items
    .filter((item) => item.requestId === id && !item.isRead)
    .map((item) => item.id);
}
