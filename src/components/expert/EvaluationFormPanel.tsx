"use client";

import {
  EVALUATION_FORM_SECTIONS,
  getSectionProgress,
  getSectionStepState,
  type SectionStepState,
} from "@/lib/expert/evaluationForm";
import type {
  EvaluationFormFieldDef,
  EvaluationFormSectionDef,
  EvaluationFormState,
} from "@/lib/expert/types";
import type { ReactNode } from "react";

const fieldShellClass =
  "appearance-none rounded-lg border-0 bg-input-bg text-sm text-text shadow-none outline-none ring-0 transition-[box-shadow,ring-color] placeholder:text-text-muted/70 focus:ring-2 focus:ring-primary/20";

const fieldInputClass = `${fieldShellClass} h-[50px] px-3.5 py-2.5`;

const fieldSelectClass = `${fieldInputClass} cursor-pointer appearance-none bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat pr-10 [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]`;

const currencySelectClass = `${fieldSelectClass} min-w-[5.75rem] max-w-[6.5rem] shrink-0 px-3 text-sm font-medium`;

const textareaClass = `${fieldShellClass} block min-h-[98px] w-full resize-none px-3.5 py-3 leading-relaxed`;

function sectionBadgeClass(state: SectionStepState): string {
  switch (state) {
    case "complete":
      return "bg-expert-action-green text-white";
    case "in_progress":
      return "bg-expert-action-green text-white";
    default:
      return "bg-input-bg text-text-muted";
  }
}

function pairedSecondaryKeys(
  fields: readonly EvaluationFormFieldDef[],
): Set<string> {
  const keys = new Set<string>();
  for (const field of fields) {
    if (field.pairWith) keys.add(field.pairWith);
  }
  return keys;
}

function FieldLabel({
  htmlFor,
  field,
}: {
  htmlFor: string;
  field: EvaluationFormFieldDef;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold uppercase tracking-[0.1em] text-[#555557]"
    >
      {field.label}
      {!field.required ? (
        <span className="font-normal normal-case tracking-normal text-text-muted">
          (Optional)
        </span>
      ) : null}
    </label>
  );
}

type EvaluationFormPanelProps = {
  form: EvaluationFormState;
  fieldErrors: Record<string, string>;
  onFieldChange: (key: string, value: string) => void;
  onFieldBlur: (key: string) => void;
  /** When true, all fields are view-only (expired / History). */
  readOnly?: boolean;
};

function renderUnitSelect(
  field: EvaluationFormFieldDef,
  form: EvaluationFormState,
  onFieldChange: (key: string, value: string) => void,
  readOnly: boolean,
) {
  if (!field.unit) return null;

  return (
    <select
      name={field.unit.key}
      aria-label={field.unit.label}
      value={form[field.unit.key] ?? field.unit.defaultValue}
      onChange={(e) => onFieldChange(field.unit!.key, e.target.value)}
      disabled={readOnly}
      className={`${currencySelectClass} disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {field.unit.options.map((option) => (
        <option key={option} value={option}>
          {field.unit!.optionLabels?.[option] ?? option}
        </option>
      ))}
    </select>
  );
}

function EvaluationFormField({
  section,
  field,
  form,
  fieldErrors,
  onFieldChange,
  onFieldBlur,
  readOnly,
}: {
  section: EvaluationFormSectionDef;
  field: EvaluationFormFieldDef;
  form: EvaluationFormState;
  fieldErrors: Record<string, string>;
  onFieldChange: (key: string, value: string) => void;
  onFieldBlur: (key: string) => void;
  readOnly: boolean;
}) {
  const id = `${section.id}-${field.key}`;
  const required = Boolean(field.required) && !readOnly;
  const error = readOnly ? undefined : fieldErrors[field.key];
  const placeholder = field.placeholder ?? "—";
  const invalidClass = error
    ? "ring-2 ring-expert-error/25 focus:ring-expert-error/25"
    : "";
  const readOnlyClass = readOnly
    ? "cursor-default opacity-90 focus:ring-0"
    : "";

  const colClass =
    field.fullWidth || field.multiline ? "sm:col-span-2" : undefined;

  const shellClass = `${fieldInputClass} ${invalidClass} ${readOnlyClass}`;

  let control: ReactNode;

  if (field.multiline) {
    control = (
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={id} field={field} />
        <textarea
          id={id}
          name={field.key}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-readonly={readOnly}
          readOnly={readOnly}
          value={form[field.key] ?? ""}
          onChange={(e) => onFieldChange(field.key, e.target.value)}
          onBlur={() => onFieldBlur(field.key)}
          placeholder={placeholder}
          className={`${textareaClass} ${invalidClass} ${readOnlyClass}`}
        />
        {error ? (
          <p className="text-xs text-expert-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  } else if (field.options) {
    control = (
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={id} field={field} />
        <select
          id={id}
          name={field.key}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          value={form[field.key] ?? ""}
          onChange={(e) => onFieldChange(field.key, e.target.value)}
          onBlur={() => onFieldBlur(field.key)}
          disabled={readOnly}
          className={`${fieldSelectClass} w-full ${invalidClass} ${
            (form[field.key] ?? "").trim() ? "text-text" : "text-text-muted/70"
          } disabled:cursor-not-allowed disabled:opacity-70`}
        >
          <option value="">
            {field.placeholder ?? `Select ${field.label.toLowerCase()}`}
          </option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {error ? (
          <p className="text-xs text-expert-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  } else if (field.unit) {
    control = (
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={id} field={field} />
        <div className="flex items-stretch gap-2">
          {field.unit.position === "start"
            ? renderUnitSelect(field, form, onFieldChange, readOnly)
            : null}
          <input
            id={id}
            name={field.key}
            type="text"
            required={required}
            aria-required={required}
            aria-invalid={Boolean(error)}
            aria-readonly={readOnly}
            readOnly={readOnly}
            inputMode={field.inputMode ?? "text"}
            value={form[field.key] ?? ""}
            onChange={(e) => onFieldChange(field.key, e.target.value)}
            onBlur={() => onFieldBlur(field.key)}
            placeholder={placeholder}
            className={`${shellClass} min-w-0 flex-1`}
          />
          {field.unit.position !== "start"
            ? renderUnitSelect(field, form, onFieldChange, readOnly)
            : null}
        </div>
        {error ? (
          <p className="text-xs text-expert-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  } else {
    control = (
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={id} field={field} />
        <input
          id={id}
          name={field.key}
          type="text"
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-readonly={readOnly}
          readOnly={readOnly}
          inputMode={field.inputMode ?? "text"}
          value={form[field.key] ?? ""}
          onChange={(e) => onFieldChange(field.key, e.target.value)}
          onBlur={() => onFieldBlur(field.key)}
          placeholder={placeholder}
          className={`${shellClass} w-full`}
        />
        {error ? (
          <p className="text-xs text-expert-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return <div className={colClass}>{control}</div>;
}

export function EvaluationFormPanel({
  form,
  fieldErrors,
  onFieldChange,
  onFieldBlur,
  readOnly = false,
}: EvaluationFormPanelProps) {
  return (
    <div className="space-y-8 sm:space-y-10">
      {EVALUATION_FORM_SECTIONS.map((section, index) => {
        const sectionState = getSectionStepState(form, section.id);
        const { filled, total } = getSectionProgress(form, section.id);

        return (
          <section key={section.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-text">
                <span
                  className={`mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${sectionBadgeClass(sectionState)}`}
                >
                  {sectionState === "complete" ? "✓" : index + 1}
                </span>
                {section.title}
              </h3>
              <span
                className={`text-xs font-medium ${
                  sectionState === "complete"
                    ? "text-expert-action-green-text"
                    : sectionState === "in_progress"
                      ? "text-expert-action-green-text"
                      : "text-text-muted"
                }`}
              >
                {sectionState === "complete"
                  ? "Completed"
                  : sectionState === "in_progress"
                    ? `${filled} of ${total} fields filled`
                    : "Not started"}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:gap-x-5 xl:gap-y-5">
              {section.fields
                .filter((field) => !pairedSecondaryKeys(section.fields).has(field.key))
                .map((field) => {
                  if (field.pairWith) {
                    const partner = section.fields.find(
                      (item) => item.key === field.pairWith,
                    );
                    if (!partner) return null;

                    return (
                      <div
                        key={field.key}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                      >
                        <EvaluationFormField
                          section={section}
                          field={field}
                          form={form}
                          fieldErrors={fieldErrors}
                          onFieldChange={onFieldChange}
                          onFieldBlur={onFieldBlur}
                          readOnly={readOnly}
                        />
                        <EvaluationFormField
                          section={section}
                          field={partner}
                          form={form}
                          fieldErrors={fieldErrors}
                          onFieldChange={onFieldChange}
                          onFieldBlur={onFieldBlur}
                          readOnly={readOnly}
                        />
                      </div>
                    );
                  }

                  return (
                    <EvaluationFormField
                      key={field.key}
                      section={section}
                      field={field}
                      form={form}
                      fieldErrors={fieldErrors}
                      onFieldChange={onFieldChange}
                      onFieldBlur={onFieldBlur}
                      readOnly={readOnly}
                    />
                  );
                })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
