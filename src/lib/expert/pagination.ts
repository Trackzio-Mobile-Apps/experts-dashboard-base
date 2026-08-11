/** Up to `windowSize` consecutive page numbers including the current page. */
export function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number,
  windowSize = 2,
): number[] {
  const total = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, currentPage), total);
  const size = Math.min(windowSize, total);

  if (total <= size) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const start = Math.min(Math.max(1, current - 1), total - size + 1);
  return Array.from({ length: size }, (_, i) => start + i);
}
