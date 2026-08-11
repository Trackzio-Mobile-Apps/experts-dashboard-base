"use client";

import { useState, type InputHTMLAttributes } from "react";

export type PasswordInputGroupProps = {
  label: string;
  id: string;
  error?: string;
  labelEmphasis?: boolean;
  inputTone?: "muted" | "surface";
  className?: string;
  inputClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "className">;

const inputShellClass =
  "w-full rounded-lg border-0 py-2.5 pl-3.5 pr-11 text-sm text-text outline-none ring-0 transition-[box-shadow,ring-color] placeholder:text-text-muted/70 focus:ring-2 focus:ring-primary/20";

const iconClass = "pointer-events-none size-5 shrink-0";

/** Open eye — password is hidden; click to reveal. */
function EyeIcon() {
  return (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Slashed eye — password is visible; click to hide. */
function EyeSlashIcon() {
  return (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function PasswordInputGroup({
  label,
  id,
  error,
  labelEmphasis = false,
  inputTone = "muted",
  className = "",
  inputClassName = "",
  ...inputProps
}: PasswordInputGroupProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const bgClass = inputTone === "surface" ? "bg-surface" : "bg-input-bg";
  const mergedInputClass = inputClassName
    ? `${inputShellClass} ${bgClass} ${inputClassName}`
    : `${inputShellClass} ${bgClass}`;

  const labelClass = labelEmphasis
    ? "text-sm font-semibold text-text"
    : "text-sm font-medium text-text-muted";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={passwordVisible ? "text" : "password"}
          className={mergedInputClass}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setPasswordVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
          aria-label={passwordVisible ? "Hide password" : "Show password"}
          aria-pressed={passwordVisible}
        >
          {passwordVisible ? <EyeSlashIcon /> : <EyeIcon />}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
