import type {
  EvaluationFormSectionDef,
  EvaluationFormUnitDef,
  EvaluationFormState,
} from "@/lib/expert/types";
import { asDisplayString } from "@/lib/expert/format";

export const WEIGHT_UNIT_OPTIONS = ["g", "mg", "kg", "oz", "gr"] as const;
export const DEFAULT_WEIGHT_UNIT = "g";

export const MINTING_METHOD_OPTIONS = [
  "Machine Struck",
  "Hand Struck",
  "Cast (Molded)",
] as const;

export const AUTHENTICITY_OPTIONS = ["Authentic", "Doubtful", "Fake"] as const;

export const PRICE_CURRENCY_OPTIONS = ["INR", "USD"] as const;
export const DEFAULT_PRICE_CURRENCY = "INR";

export const PRICE_CURRENCY_LABELS: Record<string, string> = {
  INR: "₹ INR",
  USD: "US $",
};

/** UI labels → API values for minting method. */
export const MINTING_METHOD_TO_API: Record<string, string> = {
  "Machine Struck": "Machine struck",
  "Hand Struck": "Hand struck",
  "Cast (Molded)": "Cast (Molded)",
};

const PRICE_CURRENCY: EvaluationFormUnitDef = {
  key: "priceCurrency",
  label: "Currency",
  options: PRICE_CURRENCY_OPTIONS,
  defaultValue: DEFAULT_PRICE_CURRENCY,
  optionLabels: PRICE_CURRENCY_LABELS,
  position: "start",
};

/**
 * Evaluation form aligned to the expert report field spec and `ReportContentFields`.
 * Progress + submit enforce `required: true` fields only (15 mandatory on submit).
 */
export const EVALUATION_FORM_SECTIONS: EvaluationFormSectionDef[] = [
  {
    id: "general",
    stepLabel: "General",
    title: "General information",
    fields: [
      {
        key: "coinName",
        label: "Coin Name",
        required: true,
        placeholder: "Enter coin name",
      },
      {
        key: "currencyAndDenomination",
        label: "Currency & Denomination",
        required: true,
        placeholder: "Enter currency and denomination",
      },
      {
        key: "issuer",
        label: "Issuer",
        required: true,
        placeholder: "Enter issuing country or authority",
      },
      {
        key: "yearOfMinting",
        label: "Year of Minting",
        required: true,
        pairWith: "period",
        placeholder: "Enter minting year (e.g. 1880)",
      },
      {
        key: "period",
        label: "Period",
        required: true,
        placeholder: "Enter historical period",
      },
      {
        key: "rulerOrGovt",
        label: "Ruler/Govt",
        required: true,
        placeholder: "Enter ruler or government",
      },
      {
        key: "mintLocation",
        label: "Mint Location",
        required: true,
        placeholder: "Enter mint location",
      },
    ],
  },
  {
    id: "physical",
    stepLabel: "Physical",
    title: "Physical Specifications",
    fields: [
      {
        key: "material",
        label: "Material",
        required: true,
        placeholder: "Enter material (Gold, Silver, Copper, etc.)",
      },
      {
        key: "weight",
        label: "Weight(g)",
        inputMode: "decimal",
        required: false,
        placeholder: "Enter weight in grams",
      },
      {
        key: "dominantColor",
        label: "Dominant Color",
        required: false,
        placeholder: "Enter dominant color",
      },
      {
        key: "mintingMethod",
        label: "Minting Method",
        required: false,
        options: MINTING_METHOD_OPTIONS,
        placeholder: "Select minting method",
      },
    ],
  },
  {
    id: "design",
    stepLabel: "Design",
    title: "Design Details",
    fields: [
      {
        key: "obverseDescription",
        label: "Front (Obverse) Description",
        multiline: true,
        required: true,
        fullWidth: true,
        placeholder: "Describe the front side of the coin",
      },
      {
        key: "reverseDescription",
        label: "Back (Reverse) Description",
        multiline: true,
        required: true,
        fullWidth: true,
        placeholder: "Describe the back side of the coin",
      },
      {
        key: "history",
        label: "History",
        multiline: true,
        required: false,
        fullWidth: true,
        placeholder: "Enter historical notes or interesting facts",
      },
    ],
  },
  {
    id: "market",
    stepLabel: "Market",
    title: "Market Value and Rarity",
    fields: [
      {
        key: "estimatedPriceRange",
        label: "Estimated Price Range (Min - Max)",
        required: true,
        unit: PRICE_CURRENCY,
        placeholder: "Enter estimated price range",
      },
      {
        key: "rarity",
        label: "Rarity",
        required: true,
        placeholder: "Enter rarity level",
      },
    ],
  },
  {
    id: "assessment",
    stepLabel: "Assessment",
    title: "Expert Assessment",
    fields: [
      {
        key: "authenticity",
        label: "Authenticity",
        required: true,
        options: AUTHENTICITY_OPTIONS,
        placeholder: "Select authenticity status",
      },
      {
        key: "conditionOrGrade",
        label: "Condition (Sheldon Scale)",
        required: true,
        placeholder: "Enter coin grade (e.g., VF-30)",
      },
      {
        key: "errorsOrSpecialFeatures",
        label: "Errors / Special Features",
        multiline: true,
        required: false,
        fullWidth: true,
        placeholder: "Describe any unique errors or features",
      },
      {
        key: "recommendation",
        label: "Recommendation",
        required: true,
        fullWidth: true,
        placeholder: "Enter recommendation (Buy, Hold, Sell)",
      },
    ],
  },
];

const FORM_KEYS: string[] = EVALUATION_FORM_SECTIONS.flatMap((s) =>
  s.fields.map((f) => f.key),
);

/** Unit/currency keys → default value, deduped across shared pickers. */
const UNIT_DEFAULTS: Record<string, string> = Object.fromEntries(
  EVALUATION_FORM_SECTIONS.flatMap((s) =>
    s.fields
      .filter((f) => f.unit)
      .map((f) => [f.unit!.key, f.unit!.defaultValue]),
  ),
);

function normalizeUnitValue(unitKey: string, raw: string): string {
  const fallback = UNIT_DEFAULTS[unitKey] ?? "";
  const value = raw.trim();
  if (!value) return fallback;

  const field = EVALUATION_FORM_SECTIONS.flatMap((s) => s.fields).find(
    (f) => f.unit?.key === unitKey,
  );
  const options = field?.unit?.options ?? [];
  const match = options.find(
    (option) => option.toLowerCase() === value.toLowerCase(),
  );
  return match ?? fallback;
}

const REQUIRED_KEYS: string[] = EVALUATION_FORM_SECTIONS.flatMap((s) =>
  s.fields.filter((f) => f.required).map((f) => f.key),
);

/** Legacy flat draft keys → current API-aligned keys. */
const LEGACY_FORM_KEY_ALIASES: Record<string, string> = {
  nameDesignation: "coinName",
  currency: "currencyAndDenomination",
  rulerGovt: "rulerOrGovt",
  mintStation: "mintLocation",
  weightG: "weight",
  historicalSignificance: "history",
  conditionGrade: "conditionOrGrade",
  overallGradingFeatures: "errorsOrSpecialFeatures",
  expertNotesRecommendations: "recommendation",
};

function normalizeMintingMethodFromApi(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const fromApi = Object.entries(MINTING_METHOD_TO_API).find(
    ([, apiValue]) => apiValue.toLowerCase() === trimmed.toLowerCase(),
  );
  if (fromApi) return fromApi[0];
  const fromUi = MINTING_METHOD_OPTIONS.find(
    (option) => option.toLowerCase() === trimmed.toLowerCase(),
  );
  return fromUi ?? trimmed;
}

export function mintingMethodToApi(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return MINTING_METHOD_TO_API[trimmed] ?? trimmed;
}

export function createInitialEvaluationFormState(): EvaluationFormState {
  const next: EvaluationFormState = {};
  for (const k of FORM_KEYS) next[k] = "";
  for (const [unitKey, defaultValue] of Object.entries(UNIT_DEFAULTS)) {
    next[unitKey] = defaultValue;
  }
  next.weightUnit = DEFAULT_WEIGHT_UNIT;
  return next;
}

/** Migrate older drafts and legacy flat report content into current form keys. */
export function normalizeEvaluationFormState(
  form: EvaluationFormState,
): EvaluationFormState {
  const next: EvaluationFormState = { ...createInitialEvaluationFormState() };

  for (const key of FORM_KEYS) {
    next[key] = asDisplayString(form[key]);
  }

  for (const unitKey of Object.keys(UNIT_DEFAULTS)) {
    next[unitKey] = normalizeUnitValue(unitKey, asDisplayString(form[unitKey]));
  }
  next.weightUnit =
    asDisplayString(form.weightUnit).trim() || DEFAULT_WEIGHT_UNIT;

  for (const [legacyKey, currentKey] of Object.entries(LEGACY_FORM_KEY_ALIASES)) {
    if (!(next[currentKey] ?? "").trim()) {
      next[currentKey] = asDisplayString(form[legacyKey]);
    }
  }

  if (!(next.period ?? "").trim() && (form.periodReign ?? "").trim()) {
    next.period = form.periodReign ?? "";
  }

  if (!(next.rulerOrGovt ?? "").trim() && (form.periodReign ?? "").trim()) {
    next.rulerOrGovt = form.periodReign ?? "";
  }

  const legacyMin =
    (form.estimatedValueMinUsd ?? form.estimatedPriceMin ?? "").trim();
  const legacyMax =
    (form.estimatedValueMaxUsd ?? form.estimatedPriceMax ?? "").trim();
  const combinedRange = (form.estimatedPriceRange ?? "").trim();

  if (!(next.estimatedPriceRange ?? "").trim()) {
    if (combinedRange) {
      next.estimatedPriceRange = combinedRange;
    } else if (legacyMin || legacyMax) {
      next.estimatedPriceRange = formatEstimatedPriceRange(
        legacyMin,
        legacyMax,
        asDisplayString(form.priceCurrency),
      );
    }
  }

  if (!(next.priceCurrency ?? "").trim() && combinedRange) {
    const { currency } = splitEstimatedPriceRange(combinedRange);
    if (currency) {
      next.priceCurrency = normalizeUnitValue("priceCurrency", currency);
    }
  }

  next.mintingMethod = normalizeMintingMethodFromApi(next.mintingMethod ?? "");

  const weightRaw = (next.weight ?? "").trim();
  if (weightRaw && !/^\d+(\.\d+)?$/.test(weightRaw)) {
    const parsed = parseWeightValue(weightRaw);
    next.weight = parsed.value;
    if (parsed.unit) {
      next.weightUnit = normalizeUnitValue("weightUnit", parsed.unit);
    }
  }

  return next;
}

/** Split a stored weight like `12.5 g` into its amount and unit. */
export function parseWeightValue(raw: string): {
  value: string;
  unit: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { value: "", unit: "" };

  const match = trimmed.match(/^([\d.,]+)\s*([a-zA-Z]+)?$/);
  if (!match) return { value: trimmed, unit: "" };

  return {
    value: (match[1] ?? "").replace(/,/g, "").trim(),
    unit: (match[2] ?? "").trim(),
  };
}

/** Combine weight amount and unit for the API (`2.8g`). */
export function formatWeightValue(value: string, unit: string): string {
  const amount = value.trim();
  if (!amount) return "";
  const suffix = unit.trim();
  return suffix ? `${amount}${suffix}` : amount;
}

/** Split API `estimatedPriceRange` into min/max/currency form fields. */
export function splitEstimatedPriceRange(range: string): {
  min: string;
  max: string;
  currency: string;
} {
  const trimmed = range.trim();
  if (!trimmed) return { min: "", max: "", currency: "" };

  const parts = trimmed.split(/\s*[–—-]\s*/);
  const rawMin = parts[0]?.trim() ?? "";
  const rawMax = parts.length >= 2 ? parts.slice(1).join("-").trim() : "";

  const min = parseMoneyPart(rawMin);
  const max = parseMoneyPart(rawMax);

  return {
    min: min.amount,
    max: max.amount,
    currency: min.currency || max.currency,
  };
}

function parseMoneyPart(raw: string): { amount: string; currency: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { amount: "", currency: "" };

  const isoMatch = trimmed.match(/^([A-Za-z]{3})\s+([\d.,]+)$/);
  if (isoMatch) {
    return {
      amount: (isoMatch[2] ?? "").replace(/,/g, "").trim(),
      currency: (isoMatch[1] ?? "").toUpperCase(),
    };
  }

  const symbolMatch = trimmed.match(/^([₹$€£¥])\s*([\d.,]+)$/);
  if (symbolMatch) {
    const symbol = symbolMatch[1] ?? "";
    const currencyFromSymbol = Object.entries(PRICE_CURRENCY_LABELS).find(
      ([code, label]) => label.startsWith(symbol) || code === symbol,
    )?.[0];
    return {
      amount: (symbolMatch[2] ?? "").replace(/,/g, "").trim(),
      currency: currencyFromSymbol ?? "",
    };
  }

  if (/^[\d.,]+$/.test(trimmed)) {
    return { amount: trimmed.replace(/,/g, ""), currency: "" };
  }

  return { amount: trimmed, currency: "" };
}

/** Combine min/max form fields into API `estimatedPriceRange`. */
export function formatEstimatedPriceRange(
  min: string,
  max: string,
  currency = "",
): string {
  const code = currency.trim();
  const withCode = (amount: string) =>
    code ? `${code} ${amount}` : amount;

  const a = min.trim();
  const b = max.trim();
  if (a && b) return `${withCode(a)} – ${withCode(b)}`;
  const single = a || b;
  return single ? withCode(single) : "";
}

export function evaluateFormProgress(form: EvaluationFormState): {
  percent: number;
  filled: number;
  total: number;
} {
  const total = REQUIRED_KEYS.length;
  if (!total) return { percent: 0, filled: 0, total: 0 };
  const filled = REQUIRED_KEYS.filter((k) => (form[k] ?? "").trim().length > 0)
    .length;
  return {
    percent: Math.round((filled / total) * 100),
    filled,
    total,
  };
}

export function getSectionProgress(
  form: EvaluationFormState,
  sectionId: string,
): { filled: number; total: number } {
  const sec = EVALUATION_FORM_SECTIONS.find((s) => s.id === sectionId);
  if (!sec) return { filled: 0, total: 0 };

  const requiredFields = sec.fields.filter((field) => field.required);
  const tracked = requiredFields.length > 0 ? requiredFields : sec.fields;
  const total = tracked.length;
  const filled = tracked.filter(
    (field) => (form[field.key] ?? "").trim().length > 0,
  ).length;

  return { filled, total };
}

export type SectionStepState = "complete" | "in_progress" | "pending";

export function getSectionStepState(
  form: EvaluationFormState,
  sectionId: string,
): SectionStepState {
  const sec = EVALUATION_FORM_SECTIONS.find((s) => s.id === sectionId);
  if (!sec) return "pending";

  const requiredFields = sec.fields.filter((field) => field.required);
  if (requiredFields.length === 0) {
    const anyFilled = sec.fields.some(
      (field) => (form[field.key] ?? "").trim().length > 0,
    );
    return anyFilled ? "complete" : "pending";
  }

  const filledRequired = requiredFields.filter(
    (field) => (form[field.key] ?? "").trim().length > 0,
  ).length;
  if (filledRequired === 0) return "pending";
  if (filledRequired === requiredFields.length) return "complete";
  return "in_progress";
}

export function isSectionComplete(
  form: EvaluationFormState,
  sectionId: string,
): boolean {
  return getSectionStepState(form, sectionId) === "complete";
}

export function getMissingRequiredFields(form: EvaluationFormState): string[] {
  return EVALUATION_FORM_SECTIONS.flatMap((section) =>
    section.fields
      .filter(
        (field) =>
          field.required && !(form[field.key] ?? "").trim().length,
      )
      .map((field) => field.label),
  );
}

export function areRequiredFieldsComplete(form: EvaluationFormState): boolean {
  return getMissingRequiredFields(form).length === 0;
}
