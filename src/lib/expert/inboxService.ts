import { apiClient } from "@/lib/expert/apiClient";
import { normalizeIsoDate, normalizeMongoId } from "@/lib/expert/format";
import type {
  BackendInboxItem,
  ExpertInboxApiData,
  ExpertInboxItem,
  ExpertInboxItemApiData,
} from "@/lib/expert/types";

export class ExpertInboxError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ExpertInboxError";
  }
}

function optionalId(value: unknown): string {
  return normalizeMongoId(value);
}

export function mapBackendInboxItem(raw: BackendInboxItem): ExpertInboxItem | null {
  const id = optionalId(raw._id);
  if (!id || typeof raw.event !== "string" || !raw.event.trim()) {
    return null;
  }

  const payload = raw.payload && typeof raw.payload === "object" ? raw.payload : {};
  const roundValue = payload.round;
  const round =
    typeof roundValue === "number" && Number.isFinite(roundValue)
      ? roundValue
      : null;

  return {
    id,
    event: raw.event.trim(),
    offerId: optionalId(raw.offerId) || optionalId(payload.offerId),
    requestId: optionalId(raw.requestId) || optionalId(payload.requestId),
    round,
    expiresAt: normalizeIsoDate(payload.expiresAt),
    isShown: raw.isShown === true,
    isRead: raw.isRead === true,
    isActive: raw.isActive !== false,
    createdAt: normalizeIsoDate(raw.createdAt),
    updatedAt: normalizeIsoDate(raw.updatedAt),
  };
}

function throwIfInboxFailed(status: number, message: string): never {
  throw new ExpertInboxError(message, status);
}

export async function getExpertInbox(): Promise<ExpertInboxItem[]> {
  const { status, envelope } = await apiClient.get<ExpertInboxApiData>(
    "/experts/me/inbox",
    { skipAuthHandling: true },
  );

  if (status === 401) {
    throwIfInboxFailed(status, envelope.message || "Session expired.");
  }

  if (envelope.error) {
    throwIfInboxFailed(
      status,
      envelope.message || "Unable to load inbox.",
    );
  }

  const rows = envelope.data?.inbox ?? [];
  return rows
    .map((row) => mapBackendInboxItem(row))
    .filter((row): row is ExpertInboxItem => row != null);
}

async function updateExpertInboxItem(
  inboxItemId: string,
  state: { isShown?: boolean; isRead?: boolean },
): Promise<ExpertInboxItem> {
  const id = inboxItemId.trim();
  if (!id) {
    throw new ExpertInboxError("Inbox item id is required.", 400);
  }

  const body: { isShown?: boolean; isRead?: boolean } = {};
  if (typeof state.isShown === "boolean") body.isShown = state.isShown;
  if (typeof state.isRead === "boolean") body.isRead = state.isRead;

  if (Object.keys(body).length === 0) {
    throw new ExpertInboxError("isShown or isRead must be provided", 400);
  }

  const { status, envelope } = await apiClient.patch<ExpertInboxItemApiData>(
    `/experts/me/inbox/${encodeURIComponent(id)}`,
    body,
    { skipAuthHandling: true },
  );

  if (status === 401) {
    throwIfInboxFailed(status, envelope.message || "Session expired.");
  }

  if (status === 404) {
    throwIfInboxFailed(status, envelope.message || "Inbox item not found.");
  }

  if (envelope.error || !envelope.data?.inboxItem) {
    throwIfInboxFailed(
      status,
      envelope.message || "Unable to update inbox item.",
    );
  }

  const mapped = mapBackendInboxItem(envelope.data.inboxItem);
  if (!mapped) {
    throwIfInboxFailed(status, "Unable to update inbox item.");
  }

  return mapped;
}

async function markInboxItems(
  inboxItemIds: string[],
  state: { isShown?: boolean; isRead?: boolean },
  label: string,
): Promise<void> {
  const ids = [...new Set(inboxItemIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return;

  await Promise.all(
    ids.map((id) =>
      updateExpertInboxItem(id, state).catch((error) => {
        console.warn(`[expert-inbox] failed to mark ${label}`, { id, error });
      }),
    ),
  );
}

export function markExpertInboxItemsShown(inboxItemIds: string[]) {
  return markInboxItems(inboxItemIds, { isShown: true }, "shown");
}

export function markExpertInboxItemsRead(inboxItemIds: string[]) {
  return markInboxItems(inboxItemIds, { isRead: true }, "read");
}
