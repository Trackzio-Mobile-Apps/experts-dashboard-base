import { EXPIRED_REQUEST_DETAIL_MESSAGE } from "@/lib/expert/expiredRequestNotifications";
import { useEffect } from "react";

type ExpertDeadlineExceededModalProps = {
  open: boolean;
  onGoBack: () => void;
};

export function ExpertDeadlineExceededModal({
  open,
  onGoBack,
}: ExpertDeadlineExceededModalProps) {
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
      aria-labelledby="expert-deadline-exceeded-title"
      aria-describedby="expert-deadline-exceeded-desc"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-surface px-6 pb-8 pt-6 text-center shadow-2xl sm:px-8">
        <div className="mx-auto flex h-[5.5rem] w-[5.5rem] items-center justify-center">
          <img
            src="/deadline-exceeded-warning.png"
            alt=""
            width={88}
            height={88}
            className="h-[5.5rem] w-[5.5rem] object-contain"
            aria-hidden
          />
        </div>

        <h2
          id="expert-deadline-exceeded-title"
          className="mt-6 text-xl font-semibold tracking-tight text-text"
        >
          Evaluation Deadline Exceeded
        </h2>
        <p
          id="expert-deadline-exceeded-desc"
          className="mt-2 text-sm leading-relaxed text-text-muted"
        >
          {EXPIRED_REQUEST_DETAIL_MESSAGE}
        </p>

        <button
          type="button"
          onClick={onGoBack}
          className="mt-8 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
