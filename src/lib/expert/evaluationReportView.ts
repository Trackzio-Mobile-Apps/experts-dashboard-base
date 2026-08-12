import { themeConfig } from "@/config";
import {
  EVALUATION_FORM_SECTIONS,
  normalizeEvaluationFormState,
} from "@/lib/expert/evaluationForm";
import {
  asDisplayString,
  normalizeIsoDate,
  normalizeMongoId,
} from "@/lib/expert/format";
import { contentFieldsToFormState } from "@/lib/expert/reportContentFields";
import { mediaFromReportSources } from "@/lib/expert/requestMappers";
import type {
  BackendReport,
  EvaluationFormState,
  ExpertProfile,
  RequestMediaItem,
} from "@/lib/expert/types";

export const EVALUATION_REPORT_BRAND = themeConfig.brand.reportName;
export const EVALUATION_REPORT_SUBTITLE = themeConfig.report.subtitle;
export const EVALUATION_REPORT_TITLE = themeConfig.report.title;

/** v1: compact coin + summary hero. v2: expert profile + coin cards. */
export type EvaluationReportLayoutVersion = "v1" | "v2";
export const EVALUATION_REPORT_LAYOUT_VERSION: EvaluationReportLayoutVersion =
  themeConfig.report.layoutVersion;

export type EvaluationReportFieldRow = {
  label: string;
  value: string;
};

export type EvaluationReportSection = {
  title: string;
  fields: EvaluationReportFieldRow[];
};

export type EvaluationReportExpertDisplay = {
  fullName: string;
  initials: string;
  profilePicture: string | null;
  tagline: string;
  experienceLabel: string;
  evaluationsCount: number;
  ratingAverage: number | null;
  ratingCount: number;
  expertiseTags: string[];
};

export type EvaluationReportHeroDisplay = {
  coinTitle: string;
  authenticity: string;
  condition: string;
  estimatedValue: string;
  rarity: string;
};

export type EvaluationReportDesignDetails = {
  obverse: string;
  reverse: string;
  history: string;
};

export type EvaluationReportAssessmentDisplay = {
  authenticity: string;
  authenticityNote: string;
  condition: string;
  recommendation: string;
};

export type EvaluationReportDisplay = {
  reportId: string;
  requestId: string;
  requestDisplayId: string | null;
  coinTitle: string;
  status: string;
  submittedAt: string | null;
  media: RequestMediaItem[];
  expert: EvaluationReportExpertDisplay | null;
  hero: EvaluationReportHeroDisplay;
  general: EvaluationReportSection;
  physical: EvaluationReportSection;
  market: EvaluationReportSection;
  designDetails: EvaluationReportDesignDetails;
  assessment: EvaluationReportAssessmentDisplay;
  /** @deprecated Use structured sections above; kept for compatibility. */
  sections: EvaluationReportSection[];
};

export function groupReportMedia(
  media: RequestMediaItem[],
): [string, RequestMediaItem[]][] {
  const groups = new Map<string, RequestMediaItem[]>();
  for (const item of media) {
    const label = item.group?.trim() || "Other";
    const bucket = groups.get(label);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(label, [item]);
    }
  }
  return Array.from(groups.entries());
}

function displayValue(value: unknown): string {
  const text = asDisplayString(value);
  return text || "—";
}

function profileInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase() || "?";
}

function formatExperienceYears(profile: ExpertProfile): string {
  const createdAt = profile.createdAt?.trim();
  if (!createdAt) return "—";

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "—";

  const years = Math.max(
    1,
    Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 365)),
  );
  return `${years}+ Years`;
}

function formatEstimatedValue(form: EvaluationFormState): string {
  return displayValue(form.estimatedPriceRange);
}

function buildAuthenticityNote(form: EvaluationFormState): string {
  const note = displayValue(form.errorsOrSpecialFeatures);
  if (note !== "—") return note;

  const authenticity = displayValue(form.authenticity).toLowerCase();
  if (authenticity === "authentic") {
    return "All design elements, material, and composition match authentic specimens from this period.";
  }
  if (authenticity === "doubtful") {
    return "The authenticity of this coin cannot be confirmed with confidence based on the available evidence.";
  }
  if (authenticity === "fake") {
    return "This coin seems to be a fake coin and does not match with any authentic specimens from this period.";
  }
  return "—";
}

function buildAssessmentDisplay(
  form: EvaluationFormState,
): EvaluationReportAssessmentDisplay {
  return {
    authenticity: displayValue(form.authenticity),
    authenticityNote: buildAuthenticityNote(form),
    condition: displayValue(form.conditionOrGrade),
    recommendation: displayValue(form.recommendation),
  };
}

function buildDesignDetails(form: EvaluationFormState): EvaluationReportDesignDetails {
  return {
    obverse: displayValue(form.obverseDescription),
    reverse: displayValue(form.reverseDescription),
    history: displayValue(form.history),
  };
}

function buildGeneralSection(form: EvaluationFormState): EvaluationReportSection {
  const general = EVALUATION_FORM_SECTIONS.find((section) => section.id === "general");
  if (!general) {
    return { title: "General Information", fields: [] };
  }

  return {
    title: "General Information",
    fields: general.fields.map((field) => ({
      label: field.label,
      value: displayValue(form[field.key]),
    })),
  };
}

function buildPhysicalSection(form: EvaluationFormState): EvaluationReportSection {
  const physical = EVALUATION_FORM_SECTIONS.find((section) => section.id === "physical");
  if (!physical) {
    return { title: "Physical Specifications", fields: [] };
  }

  return {
    title: "Physical Specifications",
    fields: physical.fields.map((field) => {
      if (field.key === "weight") {
        const amount = displayValue(form.weight);
        const unit = displayValue(form.weightUnit);
        return {
          label: field.label,
          value: amount === "—" ? amount : unit === "—" ? amount : `${amount} ${unit}`,
        };
      }
      return {
        label: field.label,
        value: displayValue(form[field.key]),
      };
    }),
  };
}

function buildMarketSection(form: EvaluationFormState): EvaluationReportSection {
  return {
    title: "Market Value and Rarity",
    fields: [
      { label: "Rarity", value: displayValue(form.rarity) },
      {
        label: "Est. Market Value",
        value: displayValue(form.estimatedPriceRange),
      },
    ],
  };
}

function buildHistoricalSection(form: EvaluationFormState): EvaluationReportSection {
  return {
    title: "Historical Background",
    fields: [
      {
        label: "Front (Obverse) Description",
        value: displayValue(form.obverseDescription),
      },
      {
        label: "Back (Reverse) Description",
        value: displayValue(form.reverseDescription),
      },
      { label: "History", value: displayValue(form.history) },
    ],
  };
}

function buildExpertNotesSection(form: EvaluationFormState): EvaluationReportSection {
  return {
    title: "Expert Notes",
    fields: [
      {
        label: "Errors / Special Features",
        value: displayValue(form.errorsOrSpecialFeatures),
      },
      { label: "Recommendation", value: displayValue(form.recommendation) },
    ],
  };
}

function buildAuthenticationSummarySection(
  form: EvaluationFormState,
): EvaluationReportSection {
  const authenticity = displayValue(form.authenticity);
  const condition = displayValue(form.conditionOrGrade);
  const summary =
    authenticity === "—" && condition === "—"
      ? "—"
      : `This coin has been evaluated as ${authenticity === "—" ? "—" : authenticity.toLowerCase()} with a condition grade of ${condition}.`;

  return {
    title: "Authentication Summary",
    fields: [
      { label: "Authenticity", value: authenticity },
      { label: "Condition (Sheldon Scale)", value: condition },
      { label: "Summary", value: summary },
    ],
  };
}

function buildReportSections(form: EvaluationFormState): EvaluationReportSection[] {
  return [
    buildGeneralSection(form),
    buildPhysicalSection(form),
    buildMarketSection(form),
    buildHistoricalSection(form),
    buildExpertNotesSection(form),
    buildAuthenticationSummarySection(form),
  ];
}

export function buildEvaluationReportExpertDisplay(
  profile: ExpertProfile | null | undefined,
  options?: {
    ratingAverage?: number | null;
    ratingCount?: number;
    expertiseTags?: string[];
  },
): EvaluationReportExpertDisplay | null {
  if (!profile) return null;

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const tags =
    options?.expertiseTags?.filter((tag) => tag.trim()) ??
    (profile.supportedCountries.length > 0
      ? profile.supportedCountries.slice(0, 4).map((code) => code.toUpperCase())
      : ["All regions"]);

  return {
    fullName: fullName || "Expert",
    initials: profileInitials(profile.firstName, profile.lastName),
    profilePicture: profile.profilePicture,
    tagline: profile.oneLineDescription?.trim() || "Coin evaluation expert",
    experienceLabel: formatExperienceYears(profile),
    evaluationsCount: profile.stats?.completed ?? 0,
    ratingAverage: options?.ratingAverage ?? null,
    ratingCount: options?.ratingCount ?? 0,
    expertiseTags: tags,
  };
}

/** Read-only report view from API `contentFields`. */
export function buildEvaluationReportDisplay(
  report: BackendReport,
  options?: {
    requestPayload?: unknown;
    expert?: EvaluationReportExpertDisplay | null;
  },
): EvaluationReportDisplay {
  const form = normalizeEvaluationFormState(
    contentFieldsToFormState(report.contentFields, report.content),
  );
  const coinTitle =
    asDisplayString(report.coinTitle) ||
    asDisplayString(form.coinName) ||
    "Coin Evaluation";

  const general = buildGeneralSection(form);
  const physical = buildPhysicalSection(form);
  const market = buildMarketSection(form);

  return {
    reportId: normalizeMongoId(report._id) || asDisplayString(report._id),
    requestId:
      normalizeMongoId(report.requestId) || asDisplayString(report.requestId),
    requestDisplayId: asDisplayString(report.requestDisplayId) || null,
    coinTitle,
    status: asDisplayString(report.status) || "—",
    submittedAt: normalizeIsoDate(report.submittedAt),
    media: mediaFromReportSources(
      coinTitle,
      report.attachments,
      options?.requestPayload,
    ),
    expert: options?.expert ?? null,
    hero: {
      coinTitle,
      authenticity: displayValue(form.authenticity),
      condition: displayValue(form.conditionOrGrade),
      estimatedValue: formatEstimatedValue(form),
      rarity: displayValue(form.rarity),
    },
    general,
    physical,
    market,
    designDetails: buildDesignDetails(form),
    assessment: buildAssessmentDisplay(form),
    sections: buildReportSections(form),
  };
}

export function formatReportSubmittedAt(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatReportHeaderDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatReportRating(
  average: number | null,
  count: number,
): string {
  if (average == null || count <= 0) return "—";
  return `★ ${average.toFixed(1)}`;
}

export function formatReportRequestLabel(
  requestDisplayId: string | null,
  requestId: string,
): string {
  const label = requestDisplayId?.trim() || requestId.trim();
  if (!label) return "—";
  return label.startsWith("#") ? label : `#${label}`;
}

/** Flatten report media into gallery items (images first, then video posters). */
export function reportGalleryMedia(
  media: RequestMediaItem[],
  limit = 6,
): RequestMediaItem[] {
  const items: RequestMediaItem[] = [];
  for (const item of media) {
    if (item.kind === "image") {
      items.push(item);
      continue;
    }
    if (item.poster?.trim()) {
      items.push({ ...item, kind: "image", src: item.poster });
    }
  }
  return items.slice(0, limit);
}
