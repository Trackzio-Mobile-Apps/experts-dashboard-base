import { EVALUATION_REPORT_TOKENS } from "@/lib/expert/evaluationReportTokens";
import { REPORT_PAGE_WIDTH_PX } from "@/lib/expert/evaluationReportLayoutStyles";

/** A4 portrait aspect (mm). */
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/** Vertical range of a keep-together unit, in CSS px from the page top. */
export type ReportKeepTogetherBlock = {
  top: number;
  bottom: number;
  /** Section titles — never leave these alone at the bottom of a page. */
  kind: "heading" | "content";
};

/** Max canvas height that fits one A4 page at full width (no horizontal shrink). */
export function a4HeightForCanvasWidth(canvasWidth: number): number {
  return Math.max(
    1,
    Math.round((canvasWidth * A4_HEIGHT_MM) / A4_WIDTH_MM),
  );
}

/** Fallback header height when the DOM header is missing. */
export function fallbackReportHeaderHeightCssPx(): number {
  const { header } = EVALUATION_REPORT_TOKENS;
  return header.logoSizePx + header.paddingTopPx + header.paddingBottomPx;
}

export function measureReportHeaderHeightCssPx(page: HTMLElement): number {
  const header = page.querySelector(".eval-report-header");
  if (!(header instanceof HTMLElement)) {
    return fallbackReportHeaderHeightCssPx();
  }
  const height = Math.round(header.getBoundingClientRect().height);
  return height > 0 ? height : fallbackReportHeaderHeightCssPx();
}

const CONTENT_KEEP_TOGETHER_SELECTORS = [
  ".eval-report-hero-card",
  ".eval-report-sections-grid",
  ".eval-report-field-block",
  ".eval-report-auth-card",
].join(", ");

/**
 * Measure heading + body blocks that must not be sliced mid-way across PDF pages.
 * Coordinates are CSS pixels relative to the report page top.
 */
export function measureReportKeepTogetherBlocks(
  page: HTMLElement,
): ReportKeepTogetherBlock[] {
  const pageRect = page.getBoundingClientRect();
  const blocks: ReportKeepTogetherBlock[] = [];

  const push = (element: Element, kind: ReportKeepTogetherBlock["kind"]) => {
    if (!(element instanceof HTMLElement)) return;
    const rect = element.getBoundingClientRect();
    const top = Math.round(rect.top - pageRect.top);
    const bottom = Math.round(rect.bottom - pageRect.top);
    if (bottom <= top) return;
    blocks.push({ top, bottom, kind });
  };

  page
    .querySelectorAll(".eval-report-section-heading")
    .forEach((element) => push(element, "heading"));
  page
    .querySelectorAll(CONTENT_KEEP_TOGETHER_SELECTORS)
    .forEach((element) => push(element, "content"));

  blocks.sort((a, b) => a.top - b.top || a.bottom - b.bottom);
  return dedupeKeepTogetherBlocks(blocks);
}

function dedupeKeepTogetherBlocks(
  blocks: ReportKeepTogetherBlock[],
): ReportKeepTogetherBlock[] {
  const result: ReportKeepTogetherBlock[] = [];
  for (const block of blocks) {
    const prev = result[result.length - 1];
    if (
      prev &&
      prev.kind === block.kind &&
      Math.abs(prev.top - block.top) <= 1 &&
      Math.abs(prev.bottom - block.bottom) <= 1
    ) {
      continue;
    }
    result.push(block);
  }
  return result;
}

function toCanvasBlocks(
  blocks: ReportKeepTogetherBlock[],
  scale: number,
): ReportKeepTogetherBlock[] {
  return blocks.map((block) => ({
    top: Math.round(block.top * scale),
    bottom: Math.round(block.bottom * scale),
    kind: block.kind,
  }));
}

/**
 * Choose a cut Y so a heading/body block is never half on one page and half on
 * the next. If a block would be split, the whole block moves to the next page.
 */
export function findSafeContentEndY(
  contentStartY: number,
  maxContentEndY: number,
  totalHeight: number,
  blocks: ReportKeepTogetherBlock[],
): number {
  const limit = Math.min(Math.max(contentStartY, maxContentEndY), totalHeight);
  if (limit >= totalHeight) return totalHeight;

  const splitBlocks = blocks.filter(
    (block) =>
      block.top >= contentStartY - 1 &&
      block.top < limit &&
      block.bottom > limit,
  );

  let cutY = limit;
  if (splitBlocks.length > 0) {
    const earliestTop = Math.min(...splitBlocks.map((block) => block.top));
    // Block already started on this page and is taller than the remaining
    // space — forced split is the only option.
    if (earliestTop > contentStartY + 1) {
      cutY = earliestTop;
    }
  }

  return avoidOrphanHeadings(contentStartY, cutY, blocks);
}

/**
 * If a section heading would sit alone at the bottom (its body starts on the
 * next page), pull the heading onto the next page as well.
 */
export function avoidOrphanHeadings(
  contentStartY: number,
  cutY: number,
  blocks: ReportKeepTogetherBlock[],
): number {
  let adjusted = cutY;

  const headings = blocks.filter((block) => block.kind === "heading");
  const contentBlocks = blocks.filter((block) => block.kind === "content");

  for (const heading of headings) {
    if (heading.top < contentStartY - 1) continue;
    if (heading.bottom > adjusted) continue;
    if (heading.top >= adjusted) continue;

    const nextHeadingTop =
      headings
        .filter((other) => other.top > heading.top + 1)
        .reduce(
          (min, other) => Math.min(min, other.top),
          Number.POSITIVE_INFINITY,
        ) ?? Number.POSITIVE_INFINITY;

    const sectionBody = contentBlocks.filter(
      (block) =>
        block.top >= heading.bottom - 2 && block.top < nextHeadingTop,
    );

    if (sectionBody.length === 0) continue;

    const bodyOnThisPage = sectionBody.some(
      (block) => block.top < adjusted && block.bottom <= adjusted + 1,
    );

    if (!bodyOnThisPage && heading.top > contentStartY + 1) {
      adjusted = Math.min(adjusted, heading.top);
    }
  }

  return adjusted;
}

function createFilledCanvas(
  width: number,
  height: number,
  fillStyle: string,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = fillStyle;
    context.fillRect(0, 0, width, height);
  }
  return canvas;
}

function buildContinuationPage(
  source: HTMLCanvasElement,
  sourceY: number,
  cutY: number,
  headerHeight: number,
  pageHeight: number,
  fillStyle: string,
): HTMLCanvasElement {
  const width = source.width;
  const page = createFilledCanvas(width, pageHeight, fillStyle);
  const context = page.getContext("2d");
  if (!context) return page;

  context.drawImage(
    source,
    0,
    0,
    width,
    headerHeight,
    0,
    0,
    width,
    headerHeight,
  );

  const take = Math.max(0, cutY - sourceY);
  if (take > 0) {
    context.drawImage(
      source,
      0,
      sourceY,
      width,
      take,
      0,
      headerHeight,
      width,
      take,
    );
  }
  return page;
}

/**
 * Split a tall report page canvas into A4-height pages at full width.
 * Cuts prefer keep-together block boundaries so headings/body text are not
 * sliced in half. Continuation pages repeat the header strip.
 */
export function paginateTallReportCanvas(
  canvas: HTMLCanvasElement,
  headerHeightCssPx: number,
  cssPageWidthPx: number = REPORT_PAGE_WIDTH_PX,
  fillStyle = "#FFFFFF",
  keepTogetherBlocks: ReportKeepTogetherBlock[] = [],
): HTMLCanvasElement[] {
  if (canvas.width <= 0 || canvas.height <= 0) {
    return [canvas];
  }

  const pageHeight = a4HeightForCanvasWidth(canvas.width);
  if (canvas.height <= pageHeight) {
    return [canvas];
  }

  const scale = canvas.width / Math.max(1, cssPageWidthPx);
  const headerHeight = Math.min(
    pageHeight - 1,
    Math.max(1, Math.round(headerHeightCssPx * scale)),
  );
  const contentHeight = pageHeight - headerHeight;
  const blocks = toCanvasBlocks(keepTogetherBlocks, scale);
  const pages: HTMLCanvasElement[] = [];

  let sourceY = 0;
  let isFirstPage = true;

  while (sourceY < canvas.height - 1) {
    const available = isFirstPage ? pageHeight : contentHeight;
    const maxEnd = sourceY + available;
    let cutY = findSafeContentEndY(sourceY, maxEnd, canvas.height, blocks);

    if (cutY <= sourceY) {
      cutY = Math.min(sourceY + available, canvas.height);
    }

    // Avoid zero-progress loops when a keep-together block is taller than the page.
    if (cutY <= sourceY) {
      cutY = Math.min(sourceY + available, canvas.height);
    }

    if (isFirstPage) {
      pages.push(createFirstPage(canvas, cutY, pageHeight, fillStyle));
    } else {
      pages.push(
        buildContinuationPage(
          canvas,
          sourceY,
          cutY,
          headerHeight,
          pageHeight,
          fillStyle,
        ),
      );
    }

    sourceY = cutY;
    isFirstPage = false;

    if (canvas.height - sourceY < 2) break;
  }

  return pages;
}

function createFirstPage(
  source: HTMLCanvasElement,
  cutY: number,
  pageHeight: number,
  fillStyle: string,
): HTMLCanvasElement {
  const width = source.width;
  const page = createFilledCanvas(width, pageHeight, fillStyle);
  const context = page.getContext("2d");
  if (!context) return page;
  const take = Math.min(cutY, pageHeight, source.height);
  if (take > 0) {
    context.drawImage(source, 0, 0, width, take, 0, 0, width, take);
  }
  return page;
}

/** How many PDF pages a captured report canvas will produce. */
export function countPaginatedReportPages(
  canvasHeight: number,
  canvasWidth: number,
  headerHeightCssPx: number,
  cssPageWidthPx: number = REPORT_PAGE_WIDTH_PX,
  keepTogetherBlocks: ReportKeepTogetherBlock[] = [],
): number {
  const pageHeight = a4HeightForCanvasWidth(canvasWidth);
  if (canvasHeight <= pageHeight) return 1;

  const scale = canvasWidth / Math.max(1, cssPageWidthPx);
  const headerHeight = Math.min(
    pageHeight - 1,
    Math.max(1, Math.round(headerHeightCssPx * scale)),
  );
  const contentHeight = pageHeight - headerHeight;
  const blocks = toCanvasBlocks(keepTogetherBlocks, scale);

  let sourceY = 0;
  let isFirstPage = true;
  let count = 0;

  while (sourceY < canvasHeight - 1) {
    const available = isFirstPage ? pageHeight : contentHeight;
    let cutY = findSafeContentEndY(
      sourceY,
      sourceY + available,
      canvasHeight,
      blocks,
    );
    if (cutY <= sourceY) {
      cutY = Math.min(sourceY + available, canvasHeight);
    }
    count += 1;
    sourceY = cutY;
    isFirstPage = false;
    if (count > 100) break;
  }

  return Math.max(1, count);
}
