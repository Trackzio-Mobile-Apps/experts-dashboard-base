import {
  draftContinueButtonClass,
  queuePrimaryButtonClass,
} from "@/config";
import { isDeadlineExceeded } from "@/lib/expert/format";
import type { QueueItemStatus, QueueRowVariant } from "@/lib/expert/types";

export { draftContinueButtonClass, queuePrimaryButtonClass };

export const QUEUE_VARIANT_STYLES: Record<
  QueueRowVariant,
  {
    accent: string;
    badge: string;
    badgeLabel: string;
    primaryButton: string;
  }
> = {
  pending_review: {
    accent: "border-l-expert-action-blue",
    badge: "bg-expert-badge-neutral text-expert-badge-neutral-text",
    badgeLabel: "In Queue",
    primaryButton:
      "bg-expert-action-blue hover:bg-expert-action-blue-hover",
  },
  in_progress: {
    accent: "border-l-expert-action-green",
    badge: "bg-expert-action-green-soft text-expert-action-green-text",
    badgeLabel: "In Progress",
    primaryButton:
      "bg-expert-action-green hover:bg-expert-action-green-hover",
  },
};

export const QUEUE_EXPIRED_ROW_STYLES = {
  accent: "border-l-expert-status-expired-text",
  badge: "bg-expert-status-expired-bg text-expert-status-expired-text",
  badgeLabel: "Expired",
  primaryButton: "bg-neutral-500 hover:bg-neutral-600",
  deadlineClass: "text-expert-status-expired-text",
};

export type QueueRowStyle = (typeof QUEUE_VARIANT_STYLES)[QueueRowVariant] & {
  deadlineClass: string;
};

export type QueueRowStyleInput = {
  variant: QueueRowVariant;
  deadlineExpired: boolean;
  status?: QueueItemStatus;
  deadlineAt?: string | null;
  nowMs?: number;
};

export function resolveQueueDeadlineExpired(
  row: QueueRowStyleInput,
): boolean {
  return (
    row.deadlineExpired ||
    isDeadlineExceeded(row.deadlineAt, row.nowMs ?? Date.now())
  );
}

export function getQueueRowStyles(row: QueueRowStyleInput): QueueRowStyle {
  if (resolveQueueDeadlineExpired(row)) {
    return {
      ...QUEUE_EXPIRED_ROW_STYLES,
      badgeLabel: "Expired",
    };
  }

  const base = QUEUE_VARIANT_STYLES[row.variant];
  return {
    ...base,
    deadlineClass: "text-text",
  };
}

/** Draft rows always use amber accent + "Draft" badge; only the action button reflects expiry. */
export const DRAFT_ROW_STYLES = {
  accent: "border-l-expert-draft-accent",
  badge:
    "bg-expert-action-amber-soft text-expert-action-amber-text ring-expert-action-amber-ring",
  continueButton:
    "bg-expert-action-green hover:bg-expert-action-green-hover",
  continueButtonExpired: "bg-neutral-400 text-white",
};
