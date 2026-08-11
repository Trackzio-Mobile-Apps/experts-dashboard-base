import type { SelectHTMLAttributes } from "react";

export type SelectGroupProps = {
  label: string;
  id: string;
  error?: string;
  labelUppercase?: boolean;
  labelHint?: string;
  inputTone?: "muted" | "surface";
  className?: string;
  selectClassName?: string;
  placeholder?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className">;

const selectShellClass =
  "w-full rounded-lg border border-input-border px-3.5 py-2.5 text-sm text-text outline-none transition-[box-shadow,border-color] focus:border-primary focus:ring-2 focus:ring-primary/20";

export function SelectGroup({
  label,
  id,
  error,
  labelUppercase = false,
  labelHint,
  inputTone = "muted",
  className = "",
  selectClassName = "",
  placeholder,
  children,
  ...selectProps
}: SelectGroupProps) {
  const bgClass = inputTone === "surface" ? "bg-surface" : "bg-input-bg";
  const mergedSelectClass = selectClassName
    ? `${selectShellClass} ${bgClass} ${selectClassName}`
    : `${selectShellClass} ${bgClass}`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={id}
        className={
          labelUppercase
            ? "flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-text"
            : "text-sm font-medium text-text-muted"
        }
      >
        <span>{label}</span>
        {labelHint ? (
          <span className="text-xs font-normal normal-case tracking-normal text-text-muted">
            {labelHint}
          </span>
        ) : null}
      </label>
      <select id={id} className={mergedSelectClass} {...selectProps}>
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {children}
      </select>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
