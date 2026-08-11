import { Link } from "@/lib/router";
import { getVisiblePageNumbers } from "@/lib/expert/pagination";

type ExpertPaginationProps = {
  page: number;
  totalPages: number;
  ariaLabel: string;
  getPageHref: (page: number) => string;
  previousLabel?: string;
  nextLabel?: string;
};

const navBtnClass =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-input-bg";
const navBtnDisabledClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-text-muted/50";
const pageBtnClass =
  "flex h-9 min-w-9 items-center justify-center rounded-lg border border-border bg-surface px-2 text-sm font-medium text-text transition-colors hover:bg-input-bg";
const pageActiveClass =
  "flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary px-2 text-sm font-semibold text-white";

export function ExpertPagination({
  page,
  totalPages,
  ariaLabel,
  getPageHref,
  previousLabel = "Previous",
  nextLabel = "Next",
}: ExpertPaginationProps) {
  const safeTotal = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, page), safeTotal);
  const visiblePages = getVisiblePageNumbers(current, safeTotal);

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label={ariaLabel}>
      {current <= 1 ? (
        <span className={navBtnDisabledClass}>{previousLabel}</span>
      ) : (
        <Link href={getPageHref(current - 1)} className={navBtnClass}>
          {previousLabel}
        </Link>
      )}

      {visiblePages.map((p) =>
        p === current ? (
          <span key={p} className={pageActiveClass} aria-current="page">
            {p}
          </span>
        ) : (
          <Link key={p} href={getPageHref(p)} className={pageBtnClass}>
            {p}
          </Link>
        ),
      )}

      {current >= safeTotal ? (
        <span className={navBtnDisabledClass}>{nextLabel}</span>
      ) : (
        <Link href={getPageHref(current + 1)} className={navBtnClass}>
          {nextLabel}
        </Link>
      )}
    </nav>
  );
}
