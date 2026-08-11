"use client";

import { useEffect } from "react";

type ExpertAvailabilityPromptModalProps = {
  open: boolean;
  isSaving?: boolean;
  onStayUnavailable: () => void;
  onMakeAvailable: () => void;
};

function AvailabilityIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.5 12.5 11 15l4.5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExpertAvailabilityPromptModal({
  open,
  isSaving = false,
  onStayUnavailable,
  onMakeAvailable,
}: ExpertAvailabilityPromptModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onStayUnavailable();
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSaving, onStayUnavailable, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expert-availability-prompt-title"
      aria-describedby="expert-availability-prompt-desc"
      onClick={() => {
        if (!isSaving) onStayUnavailable();
      }}
    >
      <div
        className="relative w-full max-w-[28rem] rounded-2xl bg-surface px-6 pb-6 pt-5 shadow-2xl sm:px-8 sm:pb-8 sm:pt-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onStayUnavailable}
          disabled={isSaving}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-black/5 hover:text-text disabled:opacity-50"
          aria-label="Close"
        >
          <span className="text-xl leading-none" aria-hidden>
            ×
          </span>
        </button>

        <div className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
            <AvailabilityIcon />
          </div>
        </div>

        <h2
          id="expert-availability-prompt-title"
          className="mt-5 text-center text-xl font-semibold tracking-tight text-text"
        >
          You are currently unavailable
        </h2>
        <p
          id="expert-availability-prompt-desc"
          className="mt-2 text-center text-sm leading-relaxed text-text-muted"
        >
          You won&apos;t receive new evaluation requests while unavailable. Would
          you like to make yourself available now?
        </p>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onStayUnavailable}
            disabled={isSaving}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text transition-colors hover:bg-black/[0.03] disabled:opacity-50"
          >
            Stay unavailable
          </button>
          <button
            type="button"
            onClick={onMakeAvailable}
            disabled={isSaving}
            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-70"
          >
            {isSaving ? "Updating…" : "Make available"}
          </button>
        </div>
      </div>
    </div>
  );
}
