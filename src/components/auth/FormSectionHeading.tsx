import type { ReactNode } from "react";

type FormSectionHeadingProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Small grey all-caps section title for long auth / registration forms.
 */
export function FormSectionHeading({
  children,
  className = "",
}: FormSectionHeadingProps) {
  return (
    <h2
      className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted ${className}`}
    >
      {children}
    </h2>
  );
}
