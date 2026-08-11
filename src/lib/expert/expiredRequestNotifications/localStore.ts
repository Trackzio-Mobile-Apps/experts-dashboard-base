import {
  EXPIRED_REQUEST_NOTIFICATION_LIMIT,
  expiredRequestNotificationStorageKey,
  type ExpiredRequestNotification,
  type ExpiredRequestNotificationStore,
} from "@/lib/expert/expiredRequestNotifications/types";

function normalizeRequestId(raw: string): string {
  return raw.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseNotification(value: unknown): ExpiredRequestNotification | null {
  if (!isRecord(value)) return null;
  const requestId =
    typeof value.requestId === "string" ? normalizeRequestId(value.requestId) : "";
  if (!requestId) return null;

  const expiredAt =
    typeof value.expiredAt === "string" && value.expiredAt.trim()
      ? value.expiredAt.trim()
      : new Date().toISOString();

  const displayId =
    typeof value.displayId === "string" && value.displayId.trim()
      ? value.displayId.trim()
      : undefined;

  const shownAt =
    typeof value.shownAt === "string" && value.shownAt.trim()
      ? value.shownAt.trim()
      : undefined;

  return { requestId, displayId, expiredAt, shownAt };
}

function sortByExpiredAtDesc(
  items: ExpiredRequestNotification[],
): ExpiredRequestNotification[] {
  return [...items].sort((a, b) => {
    const aMs = Date.parse(a.expiredAt);
    const bMs = Date.parse(b.expiredAt);
    const safeA = Number.isFinite(aMs) ? aMs : 0;
    const safeB = Number.isFinite(bMs) ? bMs : 0;
    return safeB - safeA;
  });
}

function keepLatest(
  items: ExpiredRequestNotification[],
  limit = EXPIRED_REQUEST_NOTIFICATION_LIMIT,
): ExpiredRequestNotification[] {
  return sortByExpiredAtDesc(items).slice(0, Math.max(0, limit));
}

/**
 * Browser localStorage implementation — temporary until backend persistence exists.
 * Namespaced per expertId. Survives refresh / navigation / same-browser re-login.
 */
export class LocalExpiredRequestNotificationStore
  implements ExpiredRequestNotificationStore
{
  constructor(private readonly expertId: string) {}

  private storageKey(): string {
    return expiredRequestNotificationStorageKey(this.expertId);
  }

  private readAll(): ExpiredRequestNotification[] {
    if (typeof window === "undefined" || !this.expertId.trim()) return [];

    try {
      const raw = window.localStorage.getItem(this.storageKey());
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const items: ExpiredRequestNotification[] = [];
      for (const entry of parsed) {
        const item = parseNotification(entry);
        if (item) items.push(item);
      }
      return keepLatest(items);
    } catch {
      return [];
    }
  }

  private writeAll(items: ExpiredRequestNotification[]): void {
    if (typeof window === "undefined" || !this.expertId.trim()) return;
    try {
      window.localStorage.setItem(
        this.storageKey(),
        JSON.stringify(keepLatest(items)),
      );
    } catch {
      /* quota / private mode */
    }
  }

  async recordExpiredRequests(
    requests: ExpiredRequestNotification[],
  ): Promise<void> {
    if (typeof window === "undefined" || !this.expertId.trim()) return;

    const incoming = requests
      .map((item) => parseNotification(item))
      .filter((item): item is ExpiredRequestNotification => item != null);

    if (incoming.length === 0) return;

    const byId = new Map<string, ExpiredRequestNotification>();
    for (const existing of this.readAll()) {
      byId.set(existing.requestId, existing);
    }

    for (const next of incoming) {
      const prev = byId.get(next.requestId);
      if (!prev) {
        byId.set(next.requestId, next);
        continue;
      }

      // Keep shownAt if already shown; prefer newer expiredAt / displayId.
      const prevMs = Date.parse(prev.expiredAt);
      const nextMs = Date.parse(next.expiredAt);
      const useNext =
        !Number.isFinite(prevMs) ||
        (Number.isFinite(nextMs) && nextMs >= prevMs);

      byId.set(next.requestId, {
        requestId: next.requestId,
        displayId: next.displayId ?? prev.displayId,
        expiredAt: useNext ? next.expiredAt : prev.expiredAt,
        shownAt: prev.shownAt ?? next.shownAt,
      });
    }

    this.writeAll([...byId.values()]);
  }

  async getUnshownExpiredRequests(
    limit = EXPIRED_REQUEST_NOTIFICATION_LIMIT,
  ): Promise<ExpiredRequestNotification[]> {
    const unshown = this.readAll().filter((item) => !item.shownAt);
    return keepLatest(unshown, limit);
  }

  async markAsShown(requestIds: string[]): Promise<void> {
    if (typeof window === "undefined") return;

    const ids = new Set(
      requestIds.map(normalizeRequestId).filter(Boolean),
    );
    if (ids.size === 0) return;

    const now = new Date().toISOString();
    const next = this.readAll().map((item) => {
      if (!ids.has(item.requestId) || item.shownAt) return item;
      return { ...item, shownAt: now };
    });
    this.writeAll(next);
  }
}

/** In-memory store for tests / SSR-safe fallbacks. */
export class MemoryExpiredRequestNotificationStore
  implements ExpiredRequestNotificationStore
{
  private items: ExpiredRequestNotification[] = [];

  async recordExpiredRequests(
    requests: ExpiredRequestNotification[],
  ): Promise<void> {
    const byId = new Map(
      this.items.map((item) => [item.requestId, item] as const),
    );
    for (const raw of requests) {
      const item = parseNotification(raw);
      if (!item) continue;
      const prev = byId.get(item.requestId);
      byId.set(item.requestId, {
        ...item,
        shownAt: prev?.shownAt ?? item.shownAt,
        displayId: item.displayId ?? prev?.displayId,
      });
    }
    this.items = keepLatest([...byId.values()]);
  }

  async getUnshownExpiredRequests(
    limit = EXPIRED_REQUEST_NOTIFICATION_LIMIT,
  ): Promise<ExpiredRequestNotification[]> {
    return keepLatest(
      this.items.filter((item) => !item.shownAt),
      limit,
    );
  }

  async markAsShown(requestIds: string[]): Promise<void> {
    const ids = new Set(requestIds.map(normalizeRequestId).filter(Boolean));
    const now = new Date().toISOString();
    this.items = this.items.map((item) =>
      ids.has(item.requestId) && !item.shownAt
        ? { ...item, shownAt: now }
        : item,
    );
  }

  /** Test helper */
  getAllForTests(): ExpiredRequestNotification[] {
    return [...this.items];
  }
}
