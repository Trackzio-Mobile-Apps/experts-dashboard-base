import { Link } from "@/lib/router";
import type { ReactNode } from "react";

type ExpertStatCardProps = {
  label: string;
  value: ReactNode;
  hint: string;
  href?: string;
  highlighted?: boolean;
};

const baseClassName =
  "flex h-[116px] w-full flex-col justify-between rounded-xl px-5 py-4 shadow-sm sm:w-[249px] sm:shrink-0";

const defaultClassName = `${baseClassName} border border-border bg-surface`;
const highlightedClassName = `${baseClassName} border border-white/10 bg-expert-sidebar text-expert-sidebar-foreground`;

const defaultInteractiveClassName =
  "transition-colors hover:border-primary/25 hover:bg-input-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";
const highlightedInteractiveClassName =
  "transition-[filter,box-shadow] hover:brightness-110 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30";

/** Figma: 249×116, label / value / hint stacked with space-between */
export function ExpertStatCard({
  label,
  value,
  hint,
  href,
  highlighted = false,
}: ExpertStatCardProps) {
  const content = (
    <>
      <p
        className={`text-[11px] font-medium uppercase tracking-[0.06em] ${
          highlighted ? "text-expert-sidebar-muted" : "text-text-muted"
        }`}
      >
        {label}
      </p>
      <p
        className={`truncate text-[30px] font-semibold leading-none tracking-tight tabular-nums ${
          highlighted ? "text-expert-sidebar-foreground" : "text-text"
        }`}
      >
        {value}
      </p>
      <p
        className={`truncate text-xs leading-4 ${
          highlighted ? "text-expert-sidebar-muted" : "text-text-muted"
        }`}
      >
        {hint}
      </p>
    </>
  );

  const className = highlighted
    ? `${highlightedClassName} ${href ? highlightedInteractiveClassName : ""}`
    : `${defaultClassName} ${href ? defaultInteractiveClassName : ""}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}
