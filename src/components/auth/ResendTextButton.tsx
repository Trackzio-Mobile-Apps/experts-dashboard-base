"use client";

import type { ReactNode } from "react";

type ResendTextButtonProps = {
  children: ReactNode;
  /** Wire to your resend API; optional for static UI. */
  onResend?: () => void;
  className?: string;
};

const baseClass =
  "inline p-0 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary-hover hover:underline bg-transparent border-0 cursor-pointer font-sans";

/**
 * Looks like an accent text link but uses a button for resend actions.
 */
export function ResendTextButton({
  children,
  onResend,
  className = "",
}: ResendTextButtonProps) {
  return (
    <button
      type="button"
      className={`${baseClass} ${className}`}
      onClick={onResend}
    >
      {children}
    </button>
  );
}
