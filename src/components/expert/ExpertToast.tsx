"use client";

import { useEffect } from "react";

type ExpertToastVariant = "success" | "error" | "info";

type ExpertToastProps = {
  open: boolean;
  message: string;
  title?: string;
  variant?: ExpertToastVariant;
  onClose: () => void;
  durationMs?: number;
};

function SuccessIcon() {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-expert-action-green text-[10px] text-expert-action-green-text"
      aria-hidden
    >
      ✓
    </span>
  );
}

function ErrorIcon() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-expert-error-soft text-expert-error"
      aria-hidden
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 5.2v3.2M8 11.2h.007"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M8.69 2.46 14.4 12.4a.8.8 0 0 1-.69 1.2H2.29a.8.8 0 0 1-.69-1.2L7.31 2.46a.8.8 0 0 1 1.38 0Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function InfoIcon() {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-expert-action-blue text-[11px] font-bold leading-none text-white"
      aria-hidden
    >
      i
    </span>
  );
}

const accentClass: Record<ExpertToastVariant, string> = {
  success: "bg-expert-action-green",
  error: "bg-expert-error",
  info: "bg-expert-action-blue",
};

const positionClass: Record<ExpertToastVariant, string> = {
  success: "bottom-6 right-4 sm:bottom-8 sm:right-6",
  error: "right-4 top-20 sm:right-6 sm:top-24",
  info: "bottom-6 right-4 sm:bottom-8 sm:right-6",
};

export function ExpertToast({
  open,
  message,
  title,
  variant = "success",
  onClose,
  durationMs = 3800,
}: ExpertToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onClose, open]);

  const isError = variant === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-hidden={!open}
      className={`fixed z-[120] min-w-[22rem] max-w-[min(32rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border/60 bg-surface shadow-xl transition-[opacity,transform] duration-200 ease-out ${
        positionClass[variant]
      } ${
        open
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${accentClass[variant]}`} />
      <div className="flex items-start gap-3.5 py-3.5 pr-3.5 pl-5">
        <span className="mt-0.5">
          {variant === "error" ? (
            <ErrorIcon />
          ) : variant === "info" ? (
            <InfoIcon />
          ) : (
            <SuccessIcon />
          )}
        </span>
        <div className="min-w-0 flex-1 pt-px">
          {title ? (
            <p className="text-sm font-semibold leading-snug text-text">{title}</p>
          ) : null}
          <p
            className={`text-sm ${
              title
                ? "mt-1 font-normal leading-relaxed text-text-muted"
                : "font-semibold leading-snug text-text"
            }`}
          >
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 shrink-0 rounded-md p-1 text-lg font-normal leading-none text-text-muted transition-colors hover:bg-input-bg hover:text-text"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
