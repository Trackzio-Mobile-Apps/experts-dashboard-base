import { ExpertToast } from "@/components/expert/ExpertToast";
import {
  clearEvaluationSubmitSuccess,
  hasEvaluationSubmitSuccess,
  SUBMIT_SUCCESS_EVENT,
  SUBMIT_SUCCESS_TOAST_MS,
} from "@/lib/expert/constants";
import { useCallback, useEffect, useState } from "react";

/**
 * Survives queue → history navigation so the submit toast is not lost when
 * History lazy-loads or remounts.
 */
export function ExpertSubmitSuccessToastGate() {
  const [open, setOpen] = useState(false);

  const showIfFlagged = useCallback(() => {
    if (!hasEvaluationSubmitSuccess()) return;
    setOpen(true);
  }, []);

  useEffect(() => {
    showIfFlagged();
    window.addEventListener(SUBMIT_SUCCESS_EVENT, showIfFlagged);
    return () => {
      window.removeEventListener(SUBMIT_SUCCESS_EVENT, showIfFlagged);
    };
  }, [showIfFlagged]);

  const close = useCallback(() => {
    clearEvaluationSubmitSuccess();
    setOpen(false);
  }, []);

  return (
    <ExpertToast
      open={open}
      message="Evaluation submitted successfully"
      durationMs={SUBMIT_SUCCESS_TOAST_MS}
      onClose={close}
    />
  );
}
