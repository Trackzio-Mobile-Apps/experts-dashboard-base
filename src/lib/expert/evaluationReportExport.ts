import { themeConfig } from "@/config";
import {
  authenticityAssessmentTheme,
  authenticitySummaryTheme,
  authenticityTone,
  EVALUATION_REPORT_TOKENS,
} from "@/lib/expert/evaluationReportTokens";
import {
  evaluationReportFontLinkHtml,
  evaluationReportLayoutCss,
  evaluationReportCaptureStyles,
  EVALUATION_REPORT_INTER_FONT_URL,
  REPORT_PAGE_HEIGHT_PX,
  REPORT_PAGE_WIDTH_PX,
} from "@/lib/expert/evaluationReportLayoutStyles";
import {
  measureReportHeaderHeightCssPx,
  measureReportKeepTogetherBlocks,
  paginateTallReportCanvas,
} from "@/lib/expert/evaluationReportPdfPagination";
import type { EvaluationReportDisplay } from "@/lib/expert/evaluationReportView";
import {
  EVALUATION_REPORT_BRAND,
  EVALUATION_REPORT_LAYOUT_VERSION,
  EVALUATION_REPORT_SUBTITLE,
  EVALUATION_REPORT_TITLE,
  formatReportHeaderDate,
  formatReportRating,
  formatReportRequestLabel,
  reportGalleryMedia,
  type EvaluationReportLayoutVersion,
  type EvaluationReportSection,
} from "@/lib/expert/evaluationReportView";
import type { RequestMediaItem } from "@/lib/expert/types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const REPORT_LOGO_PATH = themeConfig.brand.logoSrc;
const REPORT_MEDIA_PROXY_PATH = "/api/expert/media";
const t = EVALUATION_REPORT_TOKENS;
const c = t.colors;
const p = t.pdf;
const REPORT_CAPTURE_SCALE = 2;

function reportLayoutStyleBlock(): string {
  return evaluationReportLayoutCss();
}

async function ensureReportFontsLoaded(doc: Document = document): Promise<void> {
  const linkId = "eval-report-inter-font";
  if (!doc.getElementById(linkId)) {
    const link = doc.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = EVALUATION_REPORT_INTER_FONT_URL;
    doc.head.appendChild(link);
  }

  if (doc.fonts?.load) {
    await Promise.all([
      doc.fonts.load('400 14px "Inter"'),
      doc.fonts.load('600 14px "Inter"'),
      doc.fonts.load('700 14px "Inter"'),
    ]).catch(() => undefined);
  }
  if (doc.fonts?.ready) {
    await doc.fonts.ready;
  }
  const timerWindow = doc.defaultView ?? window;
  await new Promise<void>((resolve) => {
    timerWindow.setTimeout(resolve, 120);
  });
}

function reportMediaFetchUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("data:")) return trimmed;
  return `${REPORT_MEDIA_PROXY_PATH}?url=${encodeURIComponent(trimmed)}`;
}

async function urlToDataUrl(url: string): Promise<string | null> {
  const fetchUrl = reportMediaFetchUrl(url);
  if (!fetchUrl) return null;

  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === "string" ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function inlineReportMediaUrls(
  report: EvaluationReportDisplay,
): Promise<(url: string) => string> {
  const cache = new Map<string, string>();
  const urls = new Set<string>();

  if (report.expert?.profilePicture) {
    urls.add(report.expert.profilePicture);
  }
  for (const item of reportGalleryMedia(report.media)) {
    urls.add(item.src);
  }
  for (const item of report.media) {
    if (item.kind === "video" && item.poster?.trim()) {
      urls.add(item.poster);
    }
  }

  await Promise.all(
    [...urls].map(async (url) => {
      const dataUrl = await urlToDataUrl(url);
      if (dataUrl) cache.set(url, dataUrl);
    }),
  );

  return (url: string) => cache.get(url.trim()) ?? reportMediaFetchUrl(url);
}

function reportDocumentStyles(): string {
  return `
    ${evaluationReportLayoutCss()}
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: ${c.canvas};
      color: ${c.text};
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .report-pages {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      width: ${REPORT_PAGE_WIDTH_PX}px;
    }
    @media print {
      @page { size: A4 portrait; margin: 0; }
      .eval-report-page {
        page-break-after: always;
        break-after: page;
      }
      .eval-report-page:last-child {
        page-break-after: auto;
        break-after: auto;
      }
    }
  `;
}

function keyValueCardHtml(section: EvaluationReportSection): string {
  const rows = section.fields
    .map(
      (field) => `
      <div class="eval-report-kv-row">
        <span class="eval-report-kv-label">${escapeHtml(field.label)}</span>
        <span class="eval-report-kv-value">${escapeHtml(field.value)}</span>
      </div>`,
    )
    .join("");
  return `<div class="eval-report-kv-card">${rows}</div>`;
}

function sectionHeadingHtml(icon: string, title: string): string {
  return `
    <div class="eval-report-section-heading">
      <span class="eval-report-section-icon">${icon}</span>
      <h3 class="eval-report-section-title">${escapeHtml(title)}</h3>
    </div>`;
}

function reportExpertHtml(
  report: EvaluationReportDisplay,
  resolveMediaUrl: (url: string) => string,
): string {
  const expert = report.expert;
  if (!expert) {
    return `<p class="eval-report-hero-tagline" style="margin-top:18px">Expert details unavailable.</p>`;
  }

  const avatar = expert.profilePicture
    ? `<img src="${escapeHtml(resolveMediaUrl(expert.profilePicture))}" alt="${escapeHtml(expert.fullName)}" class="eval-report-hero-avatar" crossorigin="anonymous" />`
    : `<div class="eval-report-hero-avatar">${escapeHtml(expert.initials)}</div>`;

  const chips = expert.expertiseTags
    .slice(0, 4)
    .map((tag) => `<span class="eval-report-chip">${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <div class="eval-report-hero-profile">
      ${avatar}
      <div>
        <h2 class="eval-report-hero-name">${escapeHtml(expert.fullName)}</h2>
        <p class="eval-report-hero-tagline">${escapeHtml(expert.tagline)}</p>
      </div>
    </div>
    <div class="eval-report-stat-box">
      <div class="eval-report-stat-row">
        <span class="eval-report-stat-label">Experience</span>
        <span class="eval-report-stat-value">${escapeHtml(expert.experienceLabel)}</span>
      </div>
      <div class="eval-report-stat-row">
        <span class="eval-report-stat-label">Evaluations</span>
        <span class="eval-report-stat-value">${expert.evaluationsCount}</span>
      </div>
      <div class="eval-report-stat-row">
        <span class="eval-report-stat-label">Rating</span>
        <span class="eval-report-stat-value">${escapeHtml(formatReportRating(expert.ratingAverage, expert.ratingCount))}</span>
      </div>
    </div>
    ${
      expert.expertiseTags.length > 0
        ? `<div class="eval-report-expertise-block"><p class="eval-report-expertise-kicker">Expertise</p><div class="eval-report-chip-row">${chips}</div></div>`
        : ""
    }`;
}

function coinGalleryItemHtml(
  item: RequestMediaItem,
  index: number,
  resolveMediaUrl: (url: string) => string,
  opts?: { isVideo?: boolean; variant?: "default" | "v1" },
): string {
  const isVideo = opts?.isVideo ?? false;
  const variant = opts?.variant ?? "default";
  const src = item.kind === "image" ? item.src : item.poster?.trim() || "";
  const zIndex = 10 - index;
  const overlap =
    variant === "v1" ? t.hero.v1CoinImageOverlapPx : t.hero.coinImageOverlapPx;
  const marginLeft = index === 0 ? 0 : -overlap;
  const content = src
    ? `<img src="${escapeHtml(resolveMediaUrl(src))}" alt="${escapeHtml(item.alt)}" loading="eager" crossorigin="anonymous" />`
    : `<span class="eval-report-coin-gallery-fallback">Video</span>`;
  const videoBadge = isVideo
    ? `<span class="eval-report-coin-video-badge">◉</span>`
    : "";

  return `<div class="eval-report-coin-gallery-item" style="z-index:${zIndex};margin-left:${marginLeft}px">${content}${videoBadge}</div>`;
}

function summaryRowHtml(
  icon: string,
  label: string,
  value: string,
  accentColor: string,
  labelColor: string,
): string {
  return `
    <div class="eval-report-summary-row">
      <span style="color:${accentColor}">${icon}</span>
      <span class="eval-report-summary-label" style="color:${labelColor}">${escapeHtml(label)}</span>
      <span class="eval-report-summary-value" style="color:${accentColor}">${escapeHtml(value)}</span>
    </div>`;
}

function reportCoinDetailsHtml(
  report: EvaluationReportDisplay,
  resolveMediaUrl: (url: string) => string,
  variant: "default" | "v1" = "default",
): string {
  const gallery = reportGalleryMedia(report.media);
  const videoItems = report.media.filter((item) => item.kind === "video");
  const galleryHtml = [
    ...gallery.map((item, index) =>
      coinGalleryItemHtml(item, index, resolveMediaUrl, { variant }),
    ),
    ...videoItems
      .slice(0, 1)
      .map((item, index) =>
        coinGalleryItemHtml(item, gallery.length + index, resolveMediaUrl, {
          isVideo: true,
          variant,
        }),
      ),
  ].join("");

  const titleHtml =
    variant === "v1"
      ? `<h2 class="eval-report-coin-title eval-report-coin-title--v1">${escapeHtml(report.hero.coinTitle)}</h2>`
      : `<div class="eval-report-coin-header">
          <h2 class="eval-report-coin-title">${escapeHtml(report.hero.coinTitle)}</h2>
          ${
            report.hero.rarity !== "—"
              ? `<span class="eval-report-rarity-badge">${escapeHtml(report.hero.rarity)}</span>`
              : ""
          }
        </div>`;

  return `
    ${titleHtml}
    ${galleryHtml ? `<div class="eval-report-coin-gallery">${galleryHtml}</div>` : ""}`;
}

function reportHeroSummaryHtml(
  report: EvaluationReportDisplay,
  extraClass = "",
): string {
  const summaryTheme = authenticitySummaryTheme(
    authenticityTone(report.hero.authenticity),
  );
  const isV1 = extraClass.includes("--v1");
  const labelColor = isV1 ? c.heroV1SummaryLabel : summaryTheme.labelColor;
  const className = `eval-report-summary-box${extraClass ? ` ${extraClass}` : ""}`;

  return `
    <div class="${className}" style="background:${summaryTheme.boxBg}">
      ${summaryRowHtml("🛡", "Authenticity", report.hero.authenticity, summaryTheme.accentColor, labelColor)}
      ${summaryRowHtml("★", "Condition", report.hero.condition, summaryTheme.accentColor, labelColor)}
      ${summaryRowHtml("◎", "Est. Value", report.hero.estimatedValue, summaryTheme.accentColor, labelColor)}
    </div>`;
}

function reportHeroV1Html(
  report: EvaluationReportDisplay,
  resolveMediaUrl: (url: string) => string,
): string {
  return `
    <section class="eval-report-hero-card eval-report-hero-card--v1">
      <div class="eval-report-hero-v1-inner">
        <div class="eval-report-hero-v1-coin">
          ${reportCoinDetailsHtml(report, resolveMediaUrl, "v1")}
        </div>
        ${reportHeroSummaryHtml(report, "eval-report-summary-box--v1")}
      </div>
    </section>`;
}

function reportHeroV2Html(
  report: EvaluationReportDisplay,
  resolveMediaUrl: (url: string) => string,
): string {
  return `
    <div class="eval-report-hero-grid">
      <section class="eval-report-hero-card">
        <p class="eval-report-hero-kicker">Evaluated by Expert</p>
        ${reportExpertHtml(report, resolveMediaUrl)}
      </section>
      <section class="eval-report-hero-card">
        ${reportCoinDetailsHtml(report, resolveMediaUrl)}
        ${reportHeroSummaryHtml(report)}
      </section>
    </div>`;
}

function reportAssessmentHtml(report: EvaluationReportDisplay): string {
  const tone = authenticityTone(report.assessment.authenticity);
  const theme = authenticityAssessmentTheme(tone);
  const authLabel =
    report.assessment.authenticity === "—"
      ? "Pending"
      : report.assessment.authenticity;
  const conditionClass = theme.showConditionTint
    ? "eval-report-condition-card eval-report-field-block"
    : "eval-report-condition-card eval-report-condition-card--plain eval-report-field-block";
  const conditionStyle = theme.showConditionTint
    ? `background:${c.conditionBg};`
    : "";

  return `
    <div class="eval-report-assessment-card">
      <div class="eval-report-auth-card" style="background:${theme.cardBg};">
        <div class="eval-report-assessment-top">
          <p class="eval-report-field-label">Authenticity</p>
          <span class="eval-report-auth-badge" style="background:${theme.badgeBg};color:${theme.badgeText};">${escapeHtml(authLabel)}</span>
        </div>
        <p class="eval-report-auth-note">${escapeHtml(report.assessment.authenticityNote)}</p>
      </div>
      <div class="${conditionClass}" style="${conditionStyle}">
        <p class="eval-report-field-label">Condition Grade</p>
        <p class="eval-report-field-value eval-report-field-value--grade">${escapeHtml(report.assessment.condition)}</p>
      </div>
      <div class="eval-report-recommendation eval-report-field-block">
        <p class="eval-report-field-label">Expert Recommendation</p>
        <p class="eval-report-field-value eval-report-field-value--body">${escapeHtml(report.assessment.recommendation)}</p>
      </div>
    </div>`;
}

function reportHeaderHtml(
  report: EvaluationReportDisplay,
  logoSrc: string,
): string {
  const requestLabel = formatReportRequestLabel(
    report.requestDisplayId,
    report.requestId,
  );
  const submittedDate = formatReportHeaderDate(report.submittedAt);

  return `
    <header class="eval-report-header">
      <div class="eval-report-header-brand">
        <img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(EVALUATION_REPORT_BRAND)}" class="eval-report-header-logo" crossorigin="anonymous" />
        <div>
          <p class="eval-report-brand-name">${escapeHtml(EVALUATION_REPORT_BRAND)}</p>
          <p class="eval-report-brand-subtitle">${escapeHtml(EVALUATION_REPORT_SUBTITLE)}</p>
        </div>
      </div>
      <div class="eval-report-header-right">
        <h1 class="eval-report-report-title">${escapeHtml(EVALUATION_REPORT_TITLE)}</h1>
        <div class="eval-report-report-meta">
          <p class="eval-report-meta-line">Request ID: <strong class="eval-report-meta-value">${escapeHtml(requestLabel)}</strong></p>
          <p class="eval-report-meta-line">Date: <strong class="eval-report-meta-value">${escapeHtml(submittedDate)}</strong></p>
        </div>
      </div>
    </header>`;
}

function reportDesignHtml(report: EvaluationReportDisplay): string {
  return `
    <div class="eval-report-design-block">
      ${sectionHeadingHtml("✎", "Design Details")}
      <div class="eval-report-design-card">
        <div class="eval-report-field-block">
          <p class="eval-report-field-label">Front (Obverse)</p>
          <p class="eval-report-field-value">${escapeHtml(report.designDetails.obverse)}</p>
        </div>
        <div class="eval-report-field-block">
          <p class="eval-report-field-label">Back (Reverse)</p>
          <p class="eval-report-field-value">${escapeHtml(report.designDetails.reverse)}</p>
        </div>
        <div class="eval-report-field-block">
          <p class="eval-report-field-label">History</p>
          <p class="eval-report-field-value">${escapeHtml(report.designDetails.history)}</p>
        </div>
      </div>
    </div>`;
}

function reportPage1Html(
  report: EvaluationReportDisplay,
  logoSrc: string,
  resolveMediaUrl: (url: string) => string,
  version: EvaluationReportLayoutVersion = EVALUATION_REPORT_LAYOUT_VERSION,
): string {
  const heroHtml =
    version === "v2"
      ? reportHeroV2Html(report, resolveMediaUrl)
      : reportHeroV1Html(report, resolveMediaUrl);

  return `
    <section class="eval-report-page" data-report-export-page="1">
      <div class="eval-report-page-body">
        ${reportHeaderHtml(report, logoSrc)}

        ${heroHtml}

        <div class="eval-report-sections-grid">
          <div>
            ${sectionHeadingHtml("📄", report.general.title)}
            ${keyValueCardHtml(report.general)}
          </div>
          <div class="eval-report-sections-right">
            <div>
              ${sectionHeadingHtml("⚖", report.physical.title)}
              ${keyValueCardHtml(report.physical)}
            </div>
            <div>
              ${sectionHeadingHtml("◎", report.market.title)}
              ${keyValueCardHtml(report.market)}
            </div>
          </div>
        </div>

        ${reportDesignHtml(report)}
      </div>
    </section>`;
}

function reportPage2Html(
  report: EvaluationReportDisplay,
  logoSrc: string,
): string {
  return `
    <section class="eval-report-page" data-report-export-page="2">
      <div class="eval-report-page-body eval-report-page-body--page-two">
        ${reportHeaderHtml(report, logoSrc)}

        <div class="eval-report-assessment-block">
          ${sectionHeadingHtml("👤", "Expert Assessment")}
          ${reportAssessmentHtml(report)}
        </div>
      </div>
    </section>`;
}

function evaluationReportBaseFilename(report: EvaluationReportDisplay): string {
  const safe = report.coinTitle
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);
  const suffix = report.reportId.slice(-8).toUpperCase();
  const brandSlug = themeConfig.brand.name.replace(/\s+/g, "-");
  return `${brandSlug}-Evaluation-${safe || "Report"}-${suffix}`;
}

export function evaluationReportPdfFilename(
  report: EvaluationReportDisplay,
): string {
  return `${evaluationReportBaseFilename(report)}.pdf`;
}

/** Standalone HTML document matching the modal report layout. */
export function buildEvaluationReportPrintHtml(
  report: EvaluationReportDisplay,
  options?: {
    logoDataUrl?: string | null;
    resolveMediaUrl?: (url: string) => string;
    version?: EvaluationReportLayoutVersion;
  },
): string {
  const logoSrc = options?.logoDataUrl ?? REPORT_LOGO_PATH;
  const resolveMediaUrl =
    options?.resolveMediaUrl ?? ((url: string) => reportMediaFetchUrl(url));
  const version = options?.version ?? EVALUATION_REPORT_LAYOUT_VERSION;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(report.coinTitle)} — ${escapeHtml(EVALUATION_REPORT_TITLE)}</title>
  ${evaluationReportFontLinkHtml()}
  <style>${reportDocumentStyles()}</style>
</head>
<body>
  <div class="report-pages">
    ${reportPage1Html(report, logoSrc, resolveMediaUrl, version)}
    ${reportPage2Html(report, logoSrc)}
  </div>
</body>
</html>`;
}

async function loadReportLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch(REPORT_LOGO_PATH);
    if (!response.ok) return null;

    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Unable to read logo."));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function mountReportExportFrame(html: string): {
  iframe: HTMLIFrameElement;
  pages: HTMLElement[];
  cleanup: () => void;
} {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Export evaluation report");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${REPORT_PAGE_WIDTH_PX}px`,
    height: `${REPORT_PAGE_HEIGHT_PX * 2 + 48}px`,
    border: "0",
    opacity: "1",
    pointerEvents: "none",
    visibility: "visible",
  });
  document.body.appendChild(iframe);

  const frameDocument = iframe.contentDocument;
  const frameWindow = iframe.contentWindow;
  if (!frameDocument || !frameWindow) {
    iframe.remove();
    throw new Error("Unable to prepare PDF export.");
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  const pages = Array.from(
    frameDocument.querySelectorAll<HTMLElement>("[data-report-export-page]"),
  );
  if (pages.length === 0) {
    iframe.remove();
    throw new Error("Unable to prepare PDF export.");
  }

  return {
    iframe,
    pages,
    cleanup: () => iframe.remove(),
  };
}

/** Grow the offscreen iframe so tall overflowing pages are fully capturable. */
function syncExportFrameHeight(iframe: HTMLIFrameElement): void {
  const doc = iframe.contentDocument;
  if (!doc) return;
  const height = Math.max(
    doc.documentElement.scrollHeight,
    doc.body?.scrollHeight ?? 0,
    REPORT_PAGE_HEIGHT_PX,
  );
  iframe.style.height = `${height + 64}px`;
}

async function waitForElementImages(root: ParentNode): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          image.onload = () => resolve();
          image.onerror = () => resolve();
        }),
    ),
  );
}

async function waitForFrameLayout(frameWindow: Window): Promise<void> {
  await waitForElementImages(frameWindow.document);
  await ensureReportFontsLoaded(frameWindow.document);
  await new Promise<void>((resolve) => {
    frameWindow.requestAnimationFrame(() => {
      frameWindow.requestAnimationFrame(() => resolve());
    });
  });
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 200);
  });
}

function buildResolveAssetUrl(
  resolveMediaUrl: (url: string) => string,
  logoDataUrl?: string | null,
): (url: string) => string {
  return (url: string) => {
    const trimmed = url.trim();
    if (
      logoDataUrl &&
      (trimmed === REPORT_LOGO_PATH ||
        trimmed.endsWith(REPORT_LOGO_PATH) ||
        trimmed.endsWith("/coinzy-logo.png"))
    ) {
      return logoDataUrl;
    }
    return resolveMediaUrl(url);
  };
}

const TRANSPARENT_PIXEL_DATA_URL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

async function inlineImagesInRoot(
  root: ParentNode,
  resolveMediaUrl: (url: string) => string,
): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(async (image) => {
      const src = image.getAttribute("src");
      if (!src || src.startsWith("data:")) return;

      let resolved = resolveMediaUrl(src);
      if (!resolved.startsWith("data:")) {
        const fetched = await urlToDataUrl(src);
        if (fetched) resolved = fetched;
      }

      if (resolved.startsWith("data:")) {
        image.setAttribute("src", resolved);
        image.removeAttribute("crossorigin");
        return;
      }

      image.removeAttribute("crossorigin");
      image.setAttribute("src", TRANSPARENT_PIXEL_DATA_URL);
    }),
  );
  await waitForElementImages(root);
}

function measureReportPageCaptureSize(page?: HTMLElement): {
  width: number;
  height: number;
  scale: number;
} {
  if (page) {
    const rect = page.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width > 0 && height > 0) {
      return { width, height, scale: REPORT_CAPTURE_SCALE };
    }
  }

  return {
    width: REPORT_PAGE_WIDTH_PX,
    height: REPORT_PAGE_HEIGHT_PX,
    scale: REPORT_CAPTURE_SCALE,
  };
}

function ensureExactCanvasSize(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  scale: number,
): HTMLCanvasElement {
  const expectedWidth = width * scale;
  const expectedHeight = height * scale;

  if (canvas.width === expectedWidth && canvas.height === expectedHeight) {
    return canvas;
  }

  const normalized = document.createElement("canvas");
  normalized.width = expectedWidth;
  normalized.height = expectedHeight;
  const context = normalized.getContext("2d");
  if (!context) return canvas;

  context.fillStyle = c.canvas;
  context.fillRect(0, 0, expectedWidth, expectedHeight);

  const sourceWidth = Math.min(canvas.width, expectedWidth);
  const sourceHeight = Math.min(canvas.height, expectedHeight);
  context.drawImage(
    canvas,
    0,
    0,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight,
  );
  return normalized;
}

function assertCanvasHasContent(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Report page capture produced an empty canvas.");
  }

  const samplePoints: Array<[number, number]> = [
    [120, 120],
    [420, 320],
    [680, 520],
    [220, 920],
    [560, 180],
  ];
  const bg = { r: 255, g: 255, b: 255 };

  let distinctPixels = 0;
  for (const [x, y] of samplePoints) {
    if (x >= canvas.width || y >= canvas.height) continue;
    const [r, g, b, a] = context.getImageData(x, y, 1, 1).data;
    if (a === 0) continue;
    if (
      Math.abs(r - bg.r) > 10 ||
      Math.abs(g - bg.g) > 10 ||
      Math.abs(b - bg.b) > 10
    ) {
      distinctPixels += 1;
    }
  }

  if (distinctPixels === 0) {
    throw new Error("Report page capture is blank.");
  }
}

function createOffscreenCaptureHost(): HTMLDivElement {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${REPORT_PAGE_WIDTH_PX}px`,
    height: "auto",
    overflow: "visible",
    pointerEvents: "none",
    zIndex: "-1",
  });
  document.body.appendChild(host);
  return host;
}

function injectReportCaptureStyles(container: HTMLElement): void {
  const doc = container.ownerDocument;
  const styleId = "eval-report-capture-styles";
  if (doc.getElementById(styleId)) return;

  const style = doc.createElement("style");
  style.id = styleId;
  style.textContent = evaluationReportCaptureStyles();
  container.insertBefore(style, container.firstChild);
}

function markReportPagesForCapture(pages: HTMLElement[]): () => void {
  for (const page of pages) {
    page.classList.add("eval-report-page--capture");
  }
  return () => {
    for (const page of pages) {
      page.classList.remove("eval-report-page--capture");
    }
  };
}

function normalizeCloneForCapture(clone: HTMLElement): void {
  clone.classList.add("eval-report-page--capture");
  clone.querySelectorAll<HTMLElement>(".eval-report-hero-profile img").forEach((avatar) => {
    avatar.className = "eval-report-hero-avatar";
    avatar.removeAttribute("style");
  });

  clone.querySelectorAll<HTMLElement>(".eval-report-hero-profile > span").forEach((avatar) => {
    if (avatar.classList.contains("eval-report-hero-name")) return;
    avatar.className = "eval-report-hero-avatar";
    avatar.removeAttribute("style");
  });

  clone.querySelectorAll<HTMLElement>(".eval-report-coin-gallery > div").forEach((item) => {
    item.className = "eval-report-coin-gallery-item";
    item.removeAttribute("style");
    item.querySelectorAll<HTMLElement>("img").forEach((image) => {
      image.className = "";
      image.removeAttribute("style");
    });
  });

  clone.querySelectorAll<HTMLElement>("*").forEach((element) => {
    for (const className of [...element.classList]) {
      if (
        !className.startsWith("eval-report-") &&
        className !== "text-text"
      ) {
        element.classList.remove(className);
      }
    }
  });
}

async function renderReportPageCanvas(
  page: HTMLElement,
  options?: { sourcePage?: HTMLElement },
): Promise<HTMLCanvasElement> {
  const { toCanvas } = await import("html-to-image");
  const view = page.ownerDocument.defaultView;
  const { width, height, scale } = measureReportPageCaptureSize(
    options?.sourcePage ?? page,
  );

  view?.scrollTo(0, 0);

  const canvas = await toCanvas(page, {
    width,
    height,
    canvasWidth: width * scale,
    canvasHeight: height * scale,
    pixelRatio: 1,
    skipAutoScale: true,
    backgroundColor: c.canvas,
    cacheBust: true,
    skipFonts: true,
    style: {
      boxShadow: "none",
      borderRadius: "0",
      margin: "0",
    },
    filter: (node) => !(node instanceof HTMLIFrameElement),
    onImageErrorHandler: () => undefined,
  });

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error("Report page capture produced an empty canvas.");
  }

  const normalized = ensureExactCanvasSize(canvas, width, height, scale);
  assertCanvasHasContent(normalized);
  return normalized;
}

async function capturePageInDocument(
  page: HTMLElement,
  captureWindow: Window,
  resolveMediaUrl: (url: string) => string,
): Promise<HTMLCanvasElement> {
  const container = page.parentElement;
  const siblings = container
    ? Array.from(
        container.querySelectorAll<HTMLElement>("[data-report-export-page]"),
      )
    : [];
  const previousDisplay = new Map<HTMLElement, string>();

  for (const sibling of siblings) {
    previousDisplay.set(sibling, sibling.style.display);
    sibling.style.display = sibling === page ? "flex" : "none";
  }

  try {
    captureWindow.scrollTo(0, 0);
    await inlineImagesInRoot(page, resolveMediaUrl);
    await ensureReportFontsLoaded(captureWindow.document);
    await waitForPaint(captureWindow);
    return renderReportPageCanvas(page, {
      sourcePage: page,
    });
  } finally {
    for (const [element, display] of previousDisplay) {
      element.style.display = display;
    }
  }
}

async function waitForPaint(win: Window = window): Promise<void> {
  await new Promise<void>((resolve) => {
    win.requestAnimationFrame(() => {
      win.requestAnimationFrame(() => resolve());
    });
  });
  await new Promise<void>((resolve) => {
    win.setTimeout(resolve, 250);
  });
}

async function capturePreviewPage(
  page: HTMLElement,
  resolveMediaUrl: (url: string) => string,
): Promise<HTMLCanvasElement> {
  const host = createOffscreenCaptureHost();
  const clone = page.cloneNode(true) as HTMLElement;

  try {
    host.appendChild(clone);
    injectReportCaptureStyles(host);
    normalizeCloneForCapture(clone);
    await inlineImagesInRoot(clone, resolveMediaUrl);
    await ensureReportFontsLoaded(document);
    await waitForPaint(window);
    return await renderReportPageCanvas(clone, { sourcePage: page });
  } finally {
    host.remove();
  }
}

function canvasToPdfImageData(
  canvas: HTMLCanvasElement,
): { dataUrl: string; format: "PNG" | "JPEG" } {
  try {
    return { dataUrl: canvas.toDataURL("image/png"), format: "PNG" };
  } catch {
    return {
      dataUrl: canvas.toDataURL("image/jpeg", 0.98),
      format: "JPEG",
    };
  }
}

function addReportPagesToPdf(
  canvases: HTMLCanvasElement[],
  jsPDF: typeof import("jspdf").jsPDF,
): import("jspdf").jsPDF {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  canvases.forEach((canvas, index) => {
    const { dataUrl, format } = canvasToPdfImageData(canvas);

    if (index > 0) pdf.addPage();

    // Always pin to full page width. Tall content is pre-sliced into A4 pages
    // (see paginateTallReportCanvas) so we never shrink horizontally.
    const renderWidth = pageWidth;
    const renderHeight = Math.min(
      pageHeight,
      renderWidth * (canvas.height / canvas.width),
    );
    pdf.addImage(dataUrl, format, 0, 0, renderWidth, renderHeight);
  });

  return pdf;
}

function getPreviewExportPages(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>("[data-report-export-page]"),
  ).sort(
    (a, b) =>
      Number(a.dataset.reportExportPage ?? 0) -
      Number(b.dataset.reportExportPage ?? 0),
  );
}

type ReportPageCaptureMode =
  | { kind: "preview" }
  | { kind: "document"; captureWindow: Window };

async function exportReportPagesToPdf(
  pages: HTMLElement[],
  report: EvaluationReportDisplay,
  resolveMediaUrl: (url: string) => string,
  logoDataUrl?: string | null,
  captureMode: ReportPageCaptureMode = { kind: "preview" },
): Promise<void> {
  const resolveAssetUrl = buildResolveAssetUrl(resolveMediaUrl, logoDataUrl);

  const canvases: HTMLCanvasElement[] = [];
  for (const page of pages) {
    if (captureMode.kind === "document") {
      captureMode.captureWindow.scrollTo(0, 0);
    }

    const captured =
      captureMode.kind === "document"
        ? await capturePageInDocument(
            page,
            captureMode.captureWindow,
            resolveAssetUrl,
          )
        : await capturePreviewPage(page, resolveAssetUrl);

    const headerHeightCssPx = measureReportHeaderHeightCssPx(page);
    const keepTogetherBlocks = measureReportKeepTogetherBlocks(page);
    canvases.push(
      ...paginateTallReportCanvas(
        captured,
        headerHeightCssPx,
        REPORT_PAGE_WIDTH_PX,
        c.canvas,
        keepTogetherBlocks,
      ),
    );
  }

  const { jsPDF } = await import("jspdf");
  const pdf = addReportPagesToPdf(canvases, jsPDF);
  pdf.save(evaluationReportPdfFilename(report));
}

async function preparePreviewPagesForCapture(
  previewPages: HTMLElement[],
): Promise<() => void> {
  await ensureReportFontsLoaded(document);
  for (const page of previewPages) {
    await waitForElementImages(page);
  }
  await waitForPaint(window);
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 150);
  });
  return markReportPagesForCapture(previewPages);
}

async function exportReportViaIframeHtml(
  report: EvaluationReportDisplay,
  resolveMediaUrl: (url: string) => string,
  logoDataUrl?: string | null,
  version: EvaluationReportLayoutVersion = EVALUATION_REPORT_LAYOUT_VERSION,
): Promise<void> {
  const html = buildEvaluationReportPrintHtml(report, {
    logoDataUrl,
    resolveMediaUrl,
    version,
  });
  const { iframe, pages, cleanup } = mountReportExportFrame(html);
  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    cleanup();
    throw new Error("Unable to prepare PDF export.");
  }

  try {
    await waitForFrameLayout(frameWindow);
    syncExportFrameHeight(iframe);
    await waitForPaint(frameWindow);
    const unmarkCapture = markReportPagesForCapture(pages);
    try {
      await exportReportPagesToPdf(
        pages,
        report,
        resolveMediaUrl,
        logoDataUrl,
        { kind: "document", captureWindow: frameWindow },
      );
    } finally {
      unmarkCapture();
    }
  } finally {
    cleanup();
  }
}

export type EvaluationReportPdfOptions = {
  previewRoot?: HTMLElement | null;
  version?: EvaluationReportLayoutVersion;
};

/** Download a `.pdf` file matching the modal report layout. */
export async function downloadEvaluationReportPdf(
  report: EvaluationReportDisplay,
  options?: EvaluationReportPdfOptions,
): Promise<void> {
  const [logoDataUrl, resolveMediaUrl] = await Promise.all([
    loadReportLogoDataUrl(),
    inlineReportMediaUrls(report),
  ]);

  const previewPages = options?.previewRoot
    ? getPreviewExportPages(options.previewRoot)
    : [];

  if (previewPages.length >= 2) {
    let unmarkCapture = () => {};
    try {
      unmarkCapture = await preparePreviewPagesForCapture(previewPages);
      await exportReportPagesToPdf(
        previewPages,
        report,
        resolveMediaUrl,
        logoDataUrl,
        { kind: "preview" },
      );
      return;
    } catch (previewError) {
      console.warn(
        "Preview PDF capture failed, falling back to HTML export.",
        previewError,
      );
    } finally {
      unmarkCapture();
    }
  }

  await exportReportViaIframeHtml(
    report,
    resolveMediaUrl,
    logoDataUrl,
    options?.version ?? EVALUATION_REPORT_LAYOUT_VERSION,
  );
}

/** Opens print dialog with report-only HTML (fallback). */
export function printEvaluationReportPdf(
  report: EvaluationReportDisplay,
): void {
  const html = buildEvaluationReportPrintHtml(report);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Print evaluation report");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = frameWindow?.document;
  if (!frameWindow || !frameDocument) {
    iframe.remove();
    return;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    frameWindow.removeEventListener("afterprint", cleanup);
    iframe.remove();
  };

  frameWindow.addEventListener("afterprint", cleanup);
  window.setTimeout(cleanup, 60_000);

  window.setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
  }, 50);
}
