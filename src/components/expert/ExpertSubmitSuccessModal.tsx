import { SuccessCheckIllustration } from "@/components/auth/SuccessCheckIllustration";
import { useEffect } from "react";

type ExpertSubmitSuccessModalProps = {
  open: boolean;
  leaving?: boolean;
  onContinue: () => void | Promise<void>;
};

export function ExpertSubmitSuccessModal({
  open,
  leaving = false,
  onContinue,
}: ExpertSubmitSuccessModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expert-submit-success-title"
      aria-describedby="expert-submit-success-desc"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-surface px-6 pb-8 pt-6 text-center shadow-2xl sm:px-8">
        <SuccessCheckIllustration className="mb-0" />

        <h2
          id="expert-submit-success-title"
          className="mt-6 text-xl font-semibold tracking-tight text-text"
        >
          Evaluation Submitted Successfully
        </h2>
        <p
          id="expert-submit-success-desc"
          className="mt-2 text-sm leading-relaxed text-text-muted"
        >
          Your evaluation report has been submitted and moved to History.
        </p>

        <button
          type="button"
          onClick={() => void onContinue()}
          disabled={leaving}
          className="mt-8 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-70"
        >
          {leaving ? "Opening History…" : "Go to History"}
        </button>
      </div>
    </div>
  );
}
