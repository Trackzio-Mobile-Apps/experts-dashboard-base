import { EVALUATION_FORM_SECTIONS } from "@/lib/expert/evaluationForm";
import type {
  EvaluationFormFieldDef,
  EvaluationFormState,
} from "@/lib/expert/types";

const MAX_TEXT = 200;
const MAX_LONG_TEXT = 5000;
const MAX_YEAR_TEXT = 50;

const POSITIVE_DECIMAL = /^\d+(\.\d{1,3})?$/;

function getFieldDef(key: string): EvaluationFormFieldDef | null {
  for (const section of EVALUATION_FORM_SECTIONS) {
    const field = section.fields.find((item) => item.key === key);
    if (field) return field;
  }
  return null;
}

function requiredMessage(label: string): string {
  return `${label} is required.`;
}

function minLengthMessage(label: string, min: number): string {
  return `${label} must be at least ${min} characters.`;
}

function maxLengthMessage(label: string, max: number): string {
  return `${label} must be ${max} characters or fewer.`;
}

function validatePositiveNumber(
  value: string,
  label: string,
  options: { pattern: RegExp; decimalsLabel: string; max?: number },
): string | null {
  if (!options.pattern.test(value)) {
    return `${label} must be a valid number (${options.decimalsLabel}).`;
  }

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return `${label} must be greater than zero.`;
  }

  if (options.max != null && amount > options.max) {
    return `${label} is too large.`;
  }

  return null;
}

function validateYearOfMinting(value: string): string | null {
  if (/^\d{1,4}$/.test(value)) {
    const year = Number(value);
    const currentYear = new Date().getFullYear() + 1;
    if (year < 600 || year > currentYear) {
      return `Enter a year between 600 and ${currentYear}.`;
    }
    return null;
  }

  if (/^\d{1,4}\s*[–—-]\s*\d{1,4}$/.test(value)) {
    const [startRaw, endRaw] = value.split(/\s*[–—-]\s*/);
    const start = Number(startRaw);
    const end = Number(endRaw);
    const currentYear = new Date().getFullYear() + 1;
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < 600 ||
      end > currentYear ||
      start > end
    ) {
      return "Enter a valid year or year range.";
    }
    return null;
  }

  if (value.length < 2) {
    return "Enter a valid year or period.";
  }

  return null;
}

function validateFieldValue(
  field: EvaluationFormFieldDef,
  value: string,
  form: EvaluationFormState,
): string | null {
  const trimmed = value.trim();
  const label = field.label;

  if (field.required && !trimmed) {
    return requiredMessage(label);
  }

  if (!trimmed) {
    return null;
  }

  switch (field.key) {
    case "coinName":
      if (trimmed.length < 2) return minLengthMessage(label, 2);
      if (trimmed.length > MAX_TEXT) return maxLengthMessage(label, MAX_TEXT);
      return null;
    case "currencyAndDenomination":
    case "issuer":
    case "period":
    case "rulerOrGovt":
    case "mintLocation":
    case "material":
    case "rarity":
    case "conditionOrGrade":
      if (trimmed.length < 2) return minLengthMessage(label, 2);
      if (trimmed.length > MAX_TEXT) return maxLengthMessage(label, MAX_TEXT);
      return null;
    case "yearOfMinting":
      if (trimmed.length > MAX_YEAR_TEXT) {
        return maxLengthMessage(label, MAX_YEAR_TEXT);
      }
      return validateYearOfMinting(trimmed);
    case "weight":
      return validatePositiveNumber(trimmed, label, {
        pattern: POSITIVE_DECIMAL,
        decimalsLabel: "up to 3 decimal places",
        max: 50_000,
      });
    case "dominantColor":
    case "mintingMethod":
      if (trimmed.length < 2) return minLengthMessage(label, 2);
      if (trimmed.length > MAX_TEXT) return maxLengthMessage(label, MAX_TEXT);
      return null;
    case "obverseDescription":
    case "reverseDescription":
      if (trimmed.length < 10) return minLengthMessage(label, 10);
      if (trimmed.length > MAX_LONG_TEXT) {
        return maxLengthMessage(label, MAX_LONG_TEXT);
      }
      return null;
    case "recommendation":
      if (trimmed.length < 2) return minLengthMessage(label, 2);
      if (trimmed.length > MAX_TEXT) return maxLengthMessage(label, MAX_TEXT);
      return null;
    case "history":
    case "errorsOrSpecialFeatures":
      if (trimmed.length < 3) return minLengthMessage(label, 3);
      if (trimmed.length > MAX_LONG_TEXT) {
        return maxLengthMessage(label, MAX_LONG_TEXT);
      }
      return null;
    case "estimatedPriceRange":
      if (trimmed.length < 3) return minLengthMessage(label, 3);
      if (trimmed.length > MAX_TEXT) return maxLengthMessage(label, MAX_TEXT);
      return null;
    case "authenticity": {
      const allowed = new Set(
        (field.options ?? []).map((option) => option.trim().toLowerCase()),
      );
      if (allowed.size > 0 && !allowed.has(trimmed.toLowerCase())) {
        return `Select a valid ${label.toLowerCase()} option.`;
      }
      return null;
    }
    default:
      if (trimmed.length > MAX_LONG_TEXT) {
        return maxLengthMessage(label, MAX_LONG_TEXT);
      }
      return null;
  }
}

export function validateEvaluationField(
  key: string,
  value: string,
  form: EvaluationFormState,
): string | null {
  const field = getFieldDef(key);
  if (!field) return null;
  return validateFieldValue(field, value, form);
}

export function validateEvaluationForm(
  form: EvaluationFormState,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const section of EVALUATION_FORM_SECTIONS) {
    for (const field of section.fields) {
      const message = validateFieldValue(field, form[field.key] ?? "", form);
      if (message) {
        errors[field.key] = message;
      }
    }
  }

  return errors;
}

export function isEvaluationFormValid(form: EvaluationFormState): boolean {
  return Object.keys(validateEvaluationForm(form)).length === 0;
}

export function getEvaluationFormErrorMessages(
  form: EvaluationFormState,
): string[] {
  return Object.values(validateEvaluationForm(form));
}
