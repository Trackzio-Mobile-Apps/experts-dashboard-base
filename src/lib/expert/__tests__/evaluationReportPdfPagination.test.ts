import {
  a4HeightForCanvasWidth,
  avoidOrphanHeadings,
  countPaginatedReportPages,
  findSafeContentEndY,
  paginateTallReportCanvas,
  type ReportKeepTogetherBlock,
} from "@/lib/expert/evaluationReportPdfPagination";

describe("evaluationReportPdfPagination", () => {
  it("keeps a single page when content fits A4 height", () => {
    const width = 571;
    const pageHeight = a4HeightForCanvasWidth(width);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = pageHeight - 40;

    const pages = paginateTallReportCanvas(canvas, 88, width);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toBe(canvas);
  });

  it("moves a heading+body block fully to the next page instead of splitting it", () => {
    const width = 571;
    const pageHeight = a4HeightForCanvasWidth(width);

    // Heading sits just above a tall body that would be sliced mid-text.
    const headingTop = pageHeight - 80;
    const headingBottom = pageHeight - 50;
    const blockTop = pageHeight - 40;
    const blockBottom = pageHeight + 120;
    const blocks: ReportKeepTogetherBlock[] = [
      { top: headingTop, bottom: headingBottom, kind: "heading" },
      { top: blockTop, bottom: blockBottom, kind: "content" },
    ];

    const cutY = findSafeContentEndY(0, pageHeight, blockBottom + 50, blocks);
    // Whole heading + body move together to the next page.
    expect(cutY).toBe(headingTop);
    expect(cutY).toBeLessThan(pageHeight);
  });

  it("does not pull an earlier section heading when a later block alone overflows", () => {
    const width = 571;
    const pageHeight = a4HeightForCanvasWidth(width);
    const blockTop = pageHeight - 40;
    const blocks: ReportKeepTogetherBlock[] = [
      { top: 200, bottom: 240, kind: "heading" },
      { top: 250, bottom: 400, kind: "content" },
      { top: blockTop, bottom: pageHeight + 100, kind: "content" },
    ];

    const cutY = findSafeContentEndY(0, pageHeight, pageHeight + 200, blocks);
    expect(cutY).toBe(blockTop);
  });

  it("pulls an orphan section heading onto the next page with its body", () => {
    const cutY = avoidOrphanHeadings(0, 500, [
      { top: 450, bottom: 480, kind: "heading" },
      { top: 500, bottom: 700, kind: "content" },
    ]);
    expect(cutY).toBe(450);
  });

  it("keeps heading with body when both fit on the page", () => {
    const cutY = avoidOrphanHeadings(0, 800, [
      { top: 450, bottom: 480, kind: "heading" },
      { top: 500, bottom: 700, kind: "content" },
    ]);
    expect(cutY).toBe(800);
  });

  it("splits tall content into multiple full-width A4 pages with repeated header space", () => {
    const width = 571;
    const pageHeight = a4HeightForCanvasWidth(width);
    const headerHeight = 88;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = pageHeight + (pageHeight - headerHeight) * 2 - 20;

    const pages = paginateTallReportCanvas(canvas, headerHeight, width);
    expect(pages.length).toBeGreaterThanOrEqual(3);
    for (const page of pages) {
      expect(page.width).toBe(width);
      expect(page.height).toBe(pageHeight);
    }
  });

  it("counts pages so overflow shifts sequence instead of shrinking width", () => {
    const width = 1142;
    const cssWidth = 571;
    const pageHeight = a4HeightForCanvasWidth(width);
    const headerCss = 88;

    expect(
      countPaginatedReportPages(pageHeight, width, headerCss, cssWidth),
    ).toBe(1);

    const tall = pageHeight + 100;
    expect(countPaginatedReportPages(tall, width, headerCss, cssWidth)).toBe(2);
  });

  it("never produces pages narrower than the source canvas width", () => {
    const width = 571;
    const pageHeight = a4HeightForCanvasWidth(width);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = pageHeight * 2 + 120;

    const pages = paginateTallReportCanvas(canvas, 90, width);
    expect(pages.every((page) => page.width === width)).toBe(true);
  });
});
