import type { TextareaHTMLAttributes } from "react";

const textareaBaseClass =
  "w-full min-h-[120px] resize-y rounded-lg border border-input-border bg-input-bg px-3.5 py-2.5 text-sm text-text outline-none transition-[box-shadow,border-color] placeholder:text-text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

export type TextareaGroupProps = {
  label: string;
  id: string;
  error?: string;
  className?: string;
  textareaClassName?: string;
  /** Override default muted label style (e.g. section-style caps). */
  labelClassName?: string;
  labelHint?: string;
  inputTone?: "muted" | "surface";
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className">;

/**
 * Label + styled textarea (bios, notes) matching auth inputs.
 */
export function TextareaGroup({
  label,
  id,
  error,
  className = "",
  textareaClassName = "",
  labelClassName = "text-sm font-medium text-text-muted",
  labelHint,
  inputTone = "muted",
  ...textareaProps
}: TextareaGroupProps) {
  const bgClass = inputTone === "surface" ? "bg-surface" : "bg-input-bg";
  const mergedClass = textareaClassName
    ? `${textareaBaseClass} ${bgClass} ${textareaClassName}`
    : `${textareaBaseClass} ${bgClass}`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={labelClassName}>
        <span>{label}</span>
        {labelHint ? (
          <span className="ml-1 text-xs font-normal normal-case tracking-normal text-text-muted">
            {labelHint}
          </span>
        ) : null}
      </label>
      <textarea id={id} className={mergedClass} {...textareaProps} />
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
