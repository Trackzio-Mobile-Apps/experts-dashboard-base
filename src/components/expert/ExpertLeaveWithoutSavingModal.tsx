"use client";

import { useEffect } from "react";

type ExpertLeaveWithoutSavingModalProps = {
  open: boolean;
  saving?: boolean;
  onStay: () => void;
  onLeave: () => void;
  onSaveAsDraft: () => void | Promise<void>;
};

export function ExpertLeaveWithoutSavingModal({
  open,
  saving = false,
  onStay,
  onLeave,
  onSaveAsDraft,
}: ExpertLeaveWithoutSavingModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onStay();
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onStay, open, saving]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expert-leave-without-saving-title"
      aria-describedby="expert-leave-without-saving-desc"
      onClick={() => {
        if (!saving) onStay();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-surface px-6 pb-8 pt-6 shadow-2xl sm:px-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onStay}
          disabled={saving}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-text-muted transition-colors hover:bg-black/5 hover:text-text disabled:opacity-50"
          aria-label="Close"
        >
          <span aria-hidden>×</span>
        </button>

        <div className="mx-auto flex h-[5.5rem] w-[5.5rem] items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- static modal asset from /public */}
          <img
            src="/leave-without-saving-warning.png"
            alt=""
            width={88}
            height={88}
            className="h-[5.5rem] w-[5.5rem] object-contain"
            aria-hidden
          />
        </div>

        <h2
          id="expert-leave-without-saving-title"
          className="mt-6 text-center text-xl font-semibold tracking-tight text-text"
        >
          Leave Without Saving
        </h2>
        <p
          id="expert-leave-without-saving-desc"
          className="mt-2 text-center text-sm leading-relaxed text-text-muted"
        >
          Auto-save failed. If you leave this page now, your unsaved changes
          will be lost.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onLeave}
            disabled={saving}
            className="rounded-full border border-primary bg-surface px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
          >
            Leave
          </button>
          <button
            type="button"
            onClick={() => void onSaveAsDraft()}
            disabled={saving}
            className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-70"
          >
            {saving ? "Saving…" : "Save as Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
