export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Normalize MongoDB ids that may arrive as a string, `$oid`, or BSON buffer object.
 */
export function normalizeMongoId(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.$oid === "string" && record.$oid.trim()) {
      return record.$oid.trim();
    }
    if (typeof record.toHexString === "function") {
      try {
        const hex = (record.toHexString as () => string)();
        if (typeof hex === "string" && hex.trim()) return hex.trim();
      } catch {
        // ignore
      }
    }
    if (record.buffer && typeof record.buffer === "object") {
      const bytes = Object.values(record.buffer as Record<string, number>);
      if (
        bytes.length > 0 &&
        bytes.every((b) => typeof b === "number" && b >= 0 && b <= 255)
      ) {
        return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    }
  }
  return "";
}

/** Coerce API values to a safe display string (never returns objects). */
export function asDisplayString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    const asId = normalizeMongoId(value);
    if (asId) return asId;
  }
  return "";
}

export function getExpertGreeting(firstName: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${firstName} 👋`;
  if (h < 17) return `Good afternoon, ${firstName} 👋`;
  return `Good evening, ${firstName} 👋`;
}

const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

/**
 * Normalize API / Mongo date values to an ISO string.
 * Handles ISO strings, epoch ms, Date, and extended JSON `{ $date: ... }`.
 */
export function normalizeIsoDate(value: unknown): string | null {
  if (value == null || value === "") return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("$date" in record) {
      return normalizeIsoDate(record.$date);
    }
    if (typeof record.$numberLong === "string") {
      const asNumber = Number(record.$numberLong);
      return Number.isFinite(asNumber) ? normalizeIsoDate(asNumber) : null;
    }
  }

  return null;
}

function parseDate(value: unknown): Date | null {
  const iso = normalizeIsoDate(value);
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Whole days remaining until the deadline (local calendar dates).
 * Editing `deadlineAt`'s date changes this immediately; same-day time-only
 * edits still show 0/1 day and should use {@link formatDeadlineRemaining}.
 */
export function daysUntil(isoDate: unknown): number {
  const target = parseDate(isoDate);
  if (!target) return 0;

  const now = new Date();
  const startUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const endUtc = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  return Math.max(0, Math.round((endUtc - startUtc) / MS_PER_DAY));
}

/** Precise remaining label driven by actual `deadlineAt` (hours + days). */
export function formatDeadlineRemaining(isoDate: unknown): string {
  const target = parseDate(isoDate);
  if (!target) return "—";

  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return "Overdue";

  const totalHours = Math.max(1, Math.ceil(diffMs / MS_PER_HOUR));
  if (totalHours < 24) {
    return totalHours === 1 ? "1 hour" : `${totalHours} hours`;
  }

  const days = Math.floor(diffMs / MS_PER_DAY);
  // Edge case: 23h–24h remaining ceil to 24 hours but floor-days is still 0.
  if (days <= 0) return "1 day";

  const remHours = Math.floor((diffMs - days * MS_PER_DAY) / MS_PER_HOUR);
  if (remHours <= 0) {
    return `${days} ${days === 1 ? "day" : "days"}`;
  }
  return `${days}d ${remHours}h`;
}

/** True when `deadlineAt` is in the past (submission no longer allowed). */
export function isDeadlineExceeded(isoDate: unknown, nowMs = Date.now()): boolean {
  const target = parseDate(isoDate);
  if (!target) return false;
  return target.getTime() <= nowMs;
}

/** Combines cached mapper flag with a live deadline check. */
export function resolveDeadlineExpired(
  deadlineAt: string | null | undefined,
  cached = false,
  nowMs = Date.now(),
): boolean {
  return cached || isDeadlineExceeded(deadlineAt, nowMs);
}

export function formatSubmitted(isoDate: unknown): string {
  const date = parseDate(isoDate);
  if (!date) return "Submitted: —";
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `Submitted: ${formatted}`;
}

export function formatReceivedOn(isoDate: unknown): string {
  const date = parseDate(isoDate);
  if (!date) return "Received on —";
  const dayPart = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `Received on ${dayPart} • ${timePart}`;
}

export function formatDeadlineDate(isoDate: unknown): string {
  const date = parseDate(isoDate);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDeadlineDue(isoDate: unknown): string {
  const formatted = formatDeadlineDate(isoDate);
  return formatted === "—" ? "Due: —" : `Due: ${formatted}`;
}

export function formatShortDate(isoDate: unknown): string {
  const date = parseDate(isoDate);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatAvgTurnaround(hours: number | null | undefined): string {
  if (hours == null || Number.isNaN(hours)) return "—";
  if (hours < 24) return `${Math.round(hours)} hrs`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "Day" : "Days"}`;
}

export function formatRequestId(id: string): string {
  if (!id) return "—";
  return id.length > 8 ? id.slice(-8).toUpperCase() : id.toUpperCase();
}

/** Queue / detail label from API `displayId`, e.g. `REQ-ID 00016` or `EV-KUBGCWV5`. */
export function formatQueueRequestIdLabel(displayId: string): string {
  const trimmed = displayId.trim();
  if (!trimmed) return "REQ-ID —";

  if (/^REQ-ID\s+/i.test(trimmed)) {
    const suffix = trimmed.replace(/^REQ-ID\s+/i, "").trim();
    if (/^\d+$/.test(suffix)) {
      return `REQ-ID ${suffix.padStart(5, "0")}`;
    }
    return `REQ-ID ${suffix.toUpperCase()}`;
  }

  const upper = trimmed.toUpperCase().replace(/_/g, "-");

  if (/^EV-[A-Z0-9]+$/.test(upper)) {
    return upper;
  }

  if (/^REQ-[A-Z0-9]+$/.test(upper)) {
    const suffix = upper.slice(4);
    if (/^\d+$/.test(suffix)) {
      return `REQ-ID ${suffix.padStart(5, "0")}`;
    }
    return `REQ-ID ${suffix}`;
  }

  if (/^\d+$/.test(trimmed)) {
    return `REQ-ID ${trimmed.padStart(5, "0")}`;
  }

  if (/^[a-f0-9]{24}$/i.test(trimmed)) {
    return `REQ-ID ${trimmed.slice(-8).toUpperCase()}`;
  }

  if (/^[a-f0-9]{8}$/i.test(trimmed)) {
    return `REQ-ID ${upper}`;
  }

  if (/[A-Za-z]/.test(trimmed)) {
    return upper.includes("-") ? upper : `REQ-ID ${upper}`;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits) {
    return `REQ-ID ${digits.slice(-5).padStart(5, "0")}`;
  }

  return `REQ-ID ${upper}`;
}

/** Whole-day deadline label for queue cards, e.g. `3 days`. */
export function formatQueueDeadlineDays(deadlineDays: number): string {
  const days = Math.max(0, deadlineDays);
  if (days === 0) return "Today";
  return `${days} ${days === 1 ? "day" : "days"}`;
}

/** Queue card deadline — `Expired` when past, otherwise day count. */
export function formatQueueDeadlineLabel(
  deadlineAt: string | null | undefined,
  deadlineDays: number,
  nowMs = Date.now(),
): string {
  if (isDeadlineExceeded(deadlineAt, nowMs)) return "Expired";
  return formatQueueDeadlineDays(deadlineDays);
}

export type HistoryPeriodFilter = "all" | "month" | "quarter";

export function parseHistoryPeriod(
  raw: string | string[] | undefined,
): HistoryPeriodFilter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "month" || v === "quarter") return v;
  return "all";
}

export function parseHistoryReportParam(
  raw: string | string[] | undefined,
): string | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

export function parseHistoryReportRequestParam(
  raw: string | string[] | undefined,
): string | null {
  return parseHistoryReportParam(raw);
}

export function buildExpertHistoryHref(opts: {
  page?: number;
  period?: HistoryPeriodFilter;
  report?: string | null;
  reportRequest?: string | null;
}): string {
  const p = new URLSearchParams();
  if (opts.page != null && opts.page > 1) {
    p.set("page", String(opts.page));
  }
  if (opts.period && opts.period !== "all") {
    p.set("period", opts.period);
  }
  if (opts.report) {
    p.set("report", opts.report);
  }
  if (opts.reportRequest) {
    p.set("reportRequest", opts.reportRequest);
  }
  const q = p.toString();
  return q ? `/expert/history?${q}` : "/expert/history";
}

export function isWithinHistoryPeriod(
  isoDate: string | null | undefined,
  period: HistoryPeriodFilter,
): boolean {
  if (period === "all") return true;
  if (!isoDate) return false;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (period === "month") return diffDays <= 31;
  return diffDays <= 92;
}
