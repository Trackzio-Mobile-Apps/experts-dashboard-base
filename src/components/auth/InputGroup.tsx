import type { InputHTMLAttributes } from "react";

export type InputGroupProps = {
  label: string;
  id: string;
  error?: string;
  /** Use semibold label (e.g. verification code field). */
  labelEmphasis?: boolean;
  /** Muted parenthetical after the label, e.g. "(hidden from users)". */
  labelHint?: string;
  /** Uppercase dark title + optional hint layout (registration fields). */
  labelUppercase?: boolean;
  /** `muted` warm fill (default auth); `surface` white field like profile forms. */
  inputTone?: "muted" | "surface";
  /** Wrapper (label + input column). */
  className?: string;
  /** Merged onto the `<input>` element. */
  inputClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

const inputShellClass =
  "w-full rounded-lg border-0 px-3.5 py-2.5 text-sm text-text outline-none ring-0 transition-[box-shadow,ring-color] placeholder:text-text-muted/70 focus:ring-2 focus:ring-primary/20";

/**
 * Label + styled input for auth and forms.
 */
export function InputGroup({
  label,
  id,
  error,
  labelEmphasis = false,
  labelHint,
  labelUppercase = false,
  inputTone = "muted",
  className = "",
  inputClassName = "",
  ...inputProps
}: InputGroupProps) {
  const bgClass = inputTone === "surface" ? "bg-surface" : "bg-input-bg";
  const mergedInputClass = inputClassName
    ? `${inputShellClass} ${bgClass} ${inputClassName}`
    : `${inputShellClass} ${bgClass}`;

  const splitLayout = Boolean(labelHint) || labelUppercase;

  const defaultLabelClass = labelEmphasis
    ? "text-sm font-semibold text-text"
    : "text-sm font-medium text-text-muted";

  const uppercaseMainClass =
    "text-xs font-semibold uppercase tracking-[0.1em] text-text";

  const mainSpanClass = labelUppercase
    ? uppercaseMainClass
    : "text-sm font-semibold text-text";

  const labelContent = splitLayout ? (
    <>
      <span className={mainSpanClass}>{label}</span>
      {labelHint ? (
        <span className="text-xs font-normal normal-case tracking-normal text-text-muted">
          {labelHint}
        </span>
      ) : null}
    </>
  ) : (
    label
  );

  const labelRowClass = splitLayout
    ? "flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5"
    : defaultLabelClass;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={id}
        className={splitLayout ? labelRowClass : defaultLabelClass}
      >
        {labelContent}
      </label>
      <input id={id} className={mergedInputClass} {...inputProps} />
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
