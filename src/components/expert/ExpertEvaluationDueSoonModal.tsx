"use client";

import { useEffect } from "react";

type ExpertEvaluationDueSoonModalProps = {
  open: boolean;
  hoursRemaining: number;
  requestLabel: string;
  onLater: () => void;
  onGoToRequest: () => void;
};

export function ExpertEvaluationDueSoonModal({
  open,
  hoursRemaining,
  requestLabel,
  onLater,
  onGoToRequest,
}: ExpertEvaluationDueSoonModalProps) {
  const hoursLabel =
    hoursRemaining === 1 ? "1 Hour" : `${hoursRemaining} Hours`;

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onLater();
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onLater, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expert-evaluation-due-soon-title"
      aria-describedby="expert-evaluation-due-soon-desc"
      onClick={onLater}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-surface px-6 pb-8 pt-6 shadow-2xl sm:px-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onLater}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-text-muted transition-colors hover:bg-black/5 hover:text-text"
          aria-label="Close"
        >
          <span aria-hidden>×</span>
        </button>

        <div className="mx-auto flex h-[5.5rem] w-[5.5rem] items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- static modal asset from /public */}
          <img
            src="/evaluation-due-soon-warning.png"
            alt=""
            width={88}
            height={88}
            className="h-[5.5rem] w-[5.5rem] object-contain"
            aria-hidden
          />
        </div>

        <h2
          id="expert-evaluation-due-soon-title"
          className="mt-6 text-center text-xl font-bold tracking-tight text-text"
        >
          Evaluation Due in {hoursLabel}
        </h2>
        <p
          id="expert-evaluation-due-soon-desc"
          className="mt-2 text-center text-sm leading-relaxed text-text-muted"
        >
          Only{" "}
          <span className="font-bold text-text">{hoursLabel}</span> remains to
          submit the evaluation for {requestLabel}. Once the deadline passes,
          this evaluation can no longer be submitted.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onLater}
            className="rounded-full border border-primary bg-surface px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            Later
          </button>
          <button
            type="button"
            onClick={onGoToRequest}
            className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Go to Request
          </button>
        </div>
      </div>
    </div>
  );
}
