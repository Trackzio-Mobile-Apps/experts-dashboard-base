import { EVALUATION_REPORT_TOKENS } from "@/lib/expert/evaluationReportTokens";

const t = EVALUATION_REPORT_TOKENS;
const c = t.colors;
const p = t.pdf;

export const EVALUATION_REPORT_INTER_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap";

/** Load Inter for consistent modal + PDF typography. */
export function evaluationReportFontFaceCss(): string {
  return `@import url('${EVALUATION_REPORT_INTER_FONT_URL}');`;
}

/** Inline report CSS for canvas capture — no @import (avoids CORS cssRules errors). */
export function evaluationReportCaptureStyles(): string {
  return evaluationReportLayoutCss();
}

export function evaluationReportFontLinkHtml(): string {
  return `<link rel="stylesheet" href="${EVALUATION_REPORT_INTER_FONT_URL}" />`;
}

/** Shared layout CSS for modal preview and PDF/print export. */
export function evaluationReportLayoutCss(): string {
  return `
    .eval-report-pages-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      width: fit-content;
      max-width: 100%;
      margin-inline: auto;
    }
    .eval-report-pages-stack--preview {
      width: fit-content;
    }
    .eval-report-page {
      width: ${t.page.maxWidthPx}px;
      min-width: ${t.page.maxWidthPx}px;
      max-width: ${t.page.maxWidthPx}px;
      flex-shrink: 0;
      align-self: center;
      height: auto;
      min-height: 0;
      max-height: none;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      overflow: visible;
      padding: ${t.page.paddingYPx}px ${t.page.paddingXPx}px;
      background: ${c.canvas};
      border: 1px solid ${c.border};
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
        sans-serif;
      font-size: 14px;
      color: ${c.text};
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .eval-report-page * {
      font-family: inherit;
    }
    .eval-report-page[data-report-export-page="1"] {
      min-height: ${p.page1HeightPx}px;
      height: auto;
      max-height: none;
    }
    .eval-report-pages-stack--preview .eval-report-page[data-report-export-page="1"],
    .eval-report-pages-stack--preview .eval-report-page[data-report-export-page="2"] {
      min-height: 0;
      height: auto;
    }
    .eval-report-page[data-report-export-page="2"] {
      height: auto;
      max-height: none;
    }
    .eval-report-page--capture {
      border-radius: 0;
      box-shadow: none;
      margin: 0;
      position: relative;
      top: 0;
      left: 0;
      transform: none;
      width: ${t.page.maxWidthPx}px !important;
      min-width: ${t.page.maxWidthPx}px !important;
      max-width: ${t.page.maxWidthPx}px !important;
      flex-shrink: 0 !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
      display: flex !important;
      flex-direction: column !important;
    }
    /* Keep page 1 at the designed frame height so PDF capture fills vertical space. */
    .eval-report-page--capture[data-report-export-page="1"] {
      min-height: ${p.page1HeightPx}px !important;
    }
    .eval-report-hero-card,
    .eval-report-kv-card,
    .eval-report-design-card,
    .eval-report-assessment-card,
    .eval-report-auth-card {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .eval-report-page-body {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      gap: ${t.page.rowGapPx}px;
      min-height: auto;
      width: 100%;
    }
    .eval-report-page-body--page-two {
      flex: 0 0 auto;
      gap: ${t.page.rowGapPx}px;
      width: 100%;
    }
    .eval-report-page-body--page-two .eval-report-design-block,
    .eval-report-page-body--page-two .eval-report-assessment-block {
      margin-top: 0;
    }
    .eval-report-header {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid ${c.border};
      padding: ${t.header.paddingTopPx}px 0 ${t.header.paddingBottomPx}px;
      flex-shrink: 0;
      width: 100%;
      box-sizing: border-box;
    }
    .eval-report-header-brand {
      display: flex;
      align-items: center;
      gap: ${t.header.brandGapPx}px;
      min-width: 0;
      flex: 1 1 auto;
    }
    .eval-report-header-logo {
      width: ${t.header.logoSizePx}px;
      height: ${t.header.logoSizePx}px;
      border-radius: ${t.header.logoRadiusPx}px;
      object-fit: cover;
      background: ${c.logoBg};
      flex-shrink: 0;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
    }
    .eval-report-brand-name {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: ${c.text};
    }
    .eval-report-brand-subtitle {
      margin: 4px 0 0;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${c.textMuted};
    }
    .eval-report-header-right {
      text-align: right;
      flex: 0 0 auto;
      min-width: 0;
      max-width: 55%;
    }
    .eval-report-report-title {
      margin: 0;
      font-size: ${t.header.reportTitleSizePx}px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: ${c.primary};
      line-height: 1.2;
      white-space: nowrap;
    }
    .eval-report-report-meta {
      margin: 8px 0 0;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    .eval-report-meta-line {
      margin: 0;
      font-size: ${t.header.metaSizePx}px;
      color: ${c.textMuted};
      line-height: 1.4;
      white-space: nowrap;
    }
    .eval-report-meta-value {
      font-weight: 700;
      color: ${c.text};
    }
    .eval-report-hero-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: ${t.hero.gapPx}px;
      margin-top: 0;
      width: 100%;
    }
    .eval-report-hero-card--v1 {
      margin-top: 0;
      background: ${c.heroV1CardBg};
      padding: ${t.hero.cardPaddingPx}px;
    }
    .eval-report-hero-v1-inner {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(180px, 42%);
      gap: ${t.hero.gapPx}px;
      align-items: center;
      width: 100%;
    }
    .eval-report-hero-v1-coin {
      min-width: 0;
    }
    .eval-report-coin-title--v1 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.35;
      color: ${c.text};
    }
    .eval-report-hero-v1-coin .eval-report-coin-gallery {
      margin-top: 12px;
    }
    .eval-report-hero-v1-coin .eval-report-coin-gallery-item {
      width: ${t.hero.v1CoinImageSizePx}px;
      height: ${t.hero.v1CoinImageSizePx}px;
    }
    .eval-report-hero-v1-coin .eval-report-coin-gallery-item + .eval-report-coin-gallery-item {
      margin-left: -${t.hero.v1CoinImageOverlapPx}px;
    }
    .eval-report-coin-video-badge {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: #fff;
      color: ${c.textMuted};
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
    }
    .eval-report-summary-box--v1 {
      margin-top: 0;
      align-self: stretch;
      border-radius: 8px;
      padding: 12px 14px;
      gap: 10px;
    }
    .eval-report-summary-box--v1 .eval-report-summary-label {
      color: ${c.heroV1SummaryLabel};
      font-weight: 500;
    }
    .eval-report-summary-box--v1 .eval-report-summary-value {
      font-weight: 700;
    }
    .eval-report-hero-card {
      border: ${t.hero.cardBorderPx}px solid ${c.border};
      border-radius: ${t.hero.cardRadiusPx}px;
      background: ${c.cardBg};
      padding: ${t.hero.cardPaddingPx}px;
      box-sizing: border-box;
      min-width: 0;
    }
    .eval-report-hero-kicker {
      margin: 0;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${c.primary};
    }
    .eval-report-hero-profile {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-top: 18px;
    }
    .eval-report-hero-name {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      line-height: 1.25;
      color: ${c.text};
    }
    .eval-report-hero-tagline {
      margin: 6px 0 0;
      font-size: 14px;
      line-height: 1.45;
      color: ${c.textMuted};
    }
    .eval-report-stat-box {
      margin-top: 18px;
      border-radius: 12px;
      border: 1px solid ${c.statBoxBorder};
      background: ${c.statBoxBg};
      padding: 0 18px;
      box-sizing: border-box;
    }
    .eval-report-expertise-block {
      margin-top: 18px;
    }
    .eval-report-expertise-kicker {
      margin: 0 0 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${c.expertiseKicker};
    }
    .eval-report-chip-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .eval-report-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 600;
      background: ${c.chipBg};
      color: ${c.chipText};
      text-align: center;
      line-height: 1.2;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .eval-report-coin-title {
      margin: 0;
      flex: 1 1 auto;
      min-width: 0;
      font-size: 16px;
      font-weight: 700;
      line-height: 1.35;
      color: ${c.text};
    }
    .eval-report-rarity-badge {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 600;
      background: ${c.rarityBg};
      color: ${c.rarityText};
      white-space: nowrap;
      text-align: center;
      line-height: 1.2;
    }
    .eval-report-summary-box {
      margin-top: 16px;
      border-radius: 8px;
      padding: 10px 14px;
      display: grid;
      gap: 10px;
      box-sizing: border-box;
    }
    .eval-report-sections-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: ${t.section.gapPx}px;
      margin-top: 0;
      width: 100%;
      align-items: stretch;
    }
    .eval-report-sections-grid > div:first-child {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .eval-report-sections-grid > div:first-child .eval-report-kv-card {
      flex: 1 1 auto;
    }
    .eval-report-sections-right {
      display: flex;
      flex-direction: column;
      gap: ${t.section.gapPx}px;
      height: 100%;
    }
    .eval-report-section-heading {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 ${t.section.headingGapPx}px;
    }
    .eval-report-section-icon {
      width: ${t.section.iconSizePx}px;
      height: ${t.section.iconSizePx}px;
      border-radius: 999px;
      background: ${c.primary};
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      text-align: center;
      line-height: 1;
      font-size: 13px;
    }
    .eval-report-section-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: ${c.primary};
    }
    .eval-report-kv-card {
      border: 1px solid ${c.border};
      border-radius: ${t.section.cardRadiusPx}px;
      overflow: hidden;
      background: ${c.surface};
    }
    .eval-report-kv-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: start;
      column-gap: 12px;
      font-size: 12px;
      padding: ${t.section.rowPaddingYPx}px ${t.section.rowPaddingXPx}px;
      border-bottom: 1px solid ${c.border};
    }
    .eval-report-kv-row:last-child {
      border-bottom: none;
    }
    .eval-report-kv-label {
      color: ${c.textMuted};
    }
    .eval-report-kv-value {
      max-width: 160px;
      text-align: right;
      font-weight: 600;
      white-space: pre-wrap;
    }
    .eval-report-summary-row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 8px;
      font-size: 12px;
    }
    .eval-report-summary-label {
      min-width: 0;
      color: ${c.summaryLabel};
    }
    .eval-report-summary-value {
      text-align: right;
      font-weight: 700;
      white-space: nowrap;
    }
    .eval-report-stat-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 16px;
      font-size: 14px;
      padding: 12px 0;
      border-bottom: 1px solid ${c.statBoxBorder};
    }
    .eval-report-stat-row:last-child {
      border-bottom: none;
    }
    .eval-report-stat-label {
      color: ${c.text};
    }
    .eval-report-stat-value {
      font-weight: 600;
      color: ${c.text};
      text-align: right;
    }
    .eval-report-coin-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: start;
      column-gap: 14px;
      width: 100%;
    }
    .eval-report-coin-gallery {
      display: flex;
      align-items: center;
      margin-top: 12px;
    }
    .eval-report-coin-gallery-item {
      width: ${t.hero.coinImageSizePx}px;
      height: ${t.hero.coinImageSizePx}px;
      border-radius: 999px;
      border: 2px solid #fff;
      overflow: hidden;
      background: ${c.inputBg};
      flex-shrink: 0;
      position: relative;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    }
    .eval-report-coin-gallery-item + .eval-report-coin-gallery-item {
      margin-left: -${t.hero.coinImageOverlapPx}px;
    }
    .eval-report-coin-gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .eval-report-coin-gallery-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: #111;
      color: #fff;
      font-size: 10px;
      font-weight: 600;
    }
    .eval-report-hero-avatar {
      width: ${t.hero.avatarSizePx}px;
      height: ${t.hero.avatarSizePx}px;
      border-radius: 999px;
      object-fit: cover;
      background: ${c.expertAvatarBg};
      color: ${c.expertAvatarText};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 600;
      flex-shrink: 0;
      text-align: center;
      line-height: 1;
    }
    .eval-report-page--capture .eval-report-auth-badge,
    .eval-report-page--capture .eval-report-rarity-badge,
    .eval-report-page--capture .eval-report-chip,
    .eval-report-page--capture .eval-report-section-icon,
    .eval-report-page--capture .eval-report-hero-avatar {
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
    }
    .eval-report-design-block {
      margin-top: 0;
      flex-shrink: 0;
      width: 100%;
    }
    .eval-report-design-card {
      border: 1px solid ${c.border};
      border-radius: ${t.section.cardRadiusPx}px;
      background: ${c.surface};
      padding: ${t.hero.cardPaddingPx}px;
      display: grid;
      gap: ${t.section.blockGapPx}px;
      overflow: visible;
    }
    .eval-report-field-block {
      display: block;
      width: 100%;
    }
    .eval-report-field-label {
      margin: 0;
      font-size: 11px;
      line-height: 1.4;
      color: ${c.labelMuted};
    }
    .eval-report-field-value {
      margin: 6px 0 0;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.45;
      color: ${c.text};
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .eval-report-auth-note {
      margin: 12px 0 0;
      font-size: 13px;
      font-weight: 400;
      line-height: 1.6;
      color: ${c.text};
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .eval-report-field-value--grade {
      font-weight: 600;
      line-height: 1.45;
    }
    .eval-report-field-value--body {
      font-weight: 400;
      line-height: 1.6;
    }
    .eval-report-assessment-block {
      margin-top: 0;
      flex-shrink: 0;
      width: 100%;
    }
    .eval-report-assessment-card {
      border: 1px solid ${c.border};
      border-radius: ${t.section.cardRadiusPx}px;
      background: ${c.surface};
      padding: ${t.hero.cardPaddingPx}px;
      display: grid;
      gap: ${t.section.blockGapPx}px;
      width: 100%;
      box-sizing: border-box;
    }
    .eval-report-auth-card {
      border-radius: 8px;
      padding: 14px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    .eval-report-assessment-top {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 20px;
      width: 100%;
    }
    .eval-report-assessment-top .eval-report-field-label {
      min-width: 0;
    }
    .eval-report-auth-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      min-width: 88px;
      min-height: 26px;
      padding: 4px 16px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.2;
      text-align: center;
      white-space: nowrap;
      justify-self: end;
    }
    .eval-report-condition-card {
      border-radius: 8px;
      padding: 14px;
      width: 100%;
      box-sizing: border-box;
    }
    .eval-report-condition-card--plain {
      padding: 0;
      border-radius: 0;
      background: transparent;
    }
    .eval-report-recommendation {
      padding: 0;
      width: 100%;
    }
    .eval-report-assessment-card .eval-report-field-block {
      min-width: 0;
    }
    .eval-report-footer {
      margin-top: auto;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      column-gap: 24px;
      border-top: 1px solid ${c.border};
      padding-top: ${t.footer.paddingTopPx}px;
      font-size: ${t.footer.fontSizePx}px;
      color: ${c.textMuted};
      flex-shrink: 0;
      width: 100%;
    }
    .eval-report-footer-right {
      text-align: right;
      justify-self: end;
    }
    .eval-report-footer-name {
      margin: 0;
      font-weight: 700;
      color: ${c.text};
    }
    .eval-report-footer-role {
      margin: 6px 0 0;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    ${evaluationReportCaptureCss()}
  `;
}

export const REPORT_PAGE_WIDTH_PX = t.page.maxWidthPx;
export const REPORT_PAGE_HEIGHT_PX = p.pageHeightPx;

/**
 * html2canvas-safe layout overrides — applied only during PDF capture
 * (`.eval-report-page--capture`). Replaces grid/flex gap patterns that
 * html2canvas renders with extra vertical space.
 */
export function evaluationReportCaptureCss(): string {
  return `
    .eval-report-page--capture,
    .eval-report-page--capture * {
      box-sizing: border-box;
    }
    .eval-report-page--capture p,
    .eval-report-page--capture h1,
    .eval-report-page--capture h2,
    .eval-report-page--capture h3 {
      margin-block-start: 0 !important;
      margin-block-end: 0 !important;
    }
    /* Same html-to-image-safe spacing for page 1 and page 2 bodies. */
    .eval-report-page--capture .eval-report-page-body,
    .eval-report-page--capture .eval-report-page-body--page-two {
      display: flex !important;
      flex-direction: column !important;
      flex: 1 1 auto !important;
      width: 100% !important;
      gap: 0 !important;
      min-height: 0 !important;
    }
    .eval-report-page--capture .eval-report-page-body > * + *,
    .eval-report-page--capture .eval-report-page-body--page-two > * + * {
      margin-top: ${t.page.rowGapPx}px !important;
    }
    .eval-report-page--capture .eval-report-hero-grid {
      display: flex !important;
      flex-direction: row !important;
      align-items: flex-start !important;
      gap: ${t.hero.gapPx}px !important;
      flex: 0 0 auto !important;
      width: 100% !important;
    }
    .eval-report-page--capture .eval-report-sections-grid {
      display: flex !important;
      flex-direction: row !important;
      align-items: stretch !important;
      gap: ${t.section.gapPx}px !important;
      flex: 0 0 auto !important;
      width: 100% !important;
    }
    .eval-report-page--capture .eval-report-hero-grid > *,
    .eval-report-page--capture .eval-report-sections-grid > * {
      flex: 1 1 0 !important;
      min-width: 0 !important;
    }
    /* Stretch General Information card to match Physical + Market column height. */
    .eval-report-page--capture .eval-report-sections-grid > div:first-child {
      display: flex !important;
      flex-direction: column !important;
      align-self: stretch !important;
      min-height: 0 !important;
    }
    .eval-report-page--capture .eval-report-sections-grid > div:first-child .eval-report-kv-card {
      flex: 1 1 auto !important;
      height: auto !important;
      min-height: 0 !important;
    }
    .eval-report-page--capture .eval-report-hero-v1-inner {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: ${t.hero.gapPx}px !important;
    }
    .eval-report-page--capture .eval-report-hero-v1-coin {
      flex: 1 1 auto !important;
      min-width: 0 !important;
    }
    .eval-report-page--capture .eval-report-summary-box--v1 {
      flex: 0 0 42% !important;
      max-width: 42% !important;
      margin-top: 0 !important;
    }
    .eval-report-page--capture .eval-report-sections-right {
      display: flex !important;
      flex-direction: column !important;
      gap: 0 !important;
      align-self: stretch !important;
      height: auto !important;
      min-height: 0 !important;
    }
    .eval-report-page--capture .eval-report-sections-right > * + * {
      margin-top: ${t.section.gapPx}px !important;
    }
    /* Let Design Details absorb remaining vertical space on page 1. */
    .eval-report-page--capture[data-report-export-page="1"] .eval-report-design-block {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      min-height: 0 !important;
      width: 100% !important;
    }
    .eval-report-page--capture[data-report-export-page="1"] .eval-report-design-card {
      flex: 1 1 auto !important;
      height: auto !important;
      min-height: 0 !important;
    }
    .eval-report-page--capture[data-report-export-page="2"] .eval-report-assessment-block {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      min-height: 0 !important;
      width: 100% !important;
    }
    .eval-report-page--capture[data-report-export-page="2"] .eval-report-assessment-card {
      flex: 1 1 auto !important;
      height: auto !important;
      min-height: 0 !important;
    }
    .eval-report-page--capture .eval-report-summary-box,
    .eval-report-page--capture .eval-report-design-card,
    .eval-report-page--capture .eval-report-assessment-card {
      display: block !important;
      gap: 0 !important;
      height: auto !important;
      min-height: 0 !important;
    }
    .eval-report-page--capture .eval-report-summary-box > * + * {
      margin-top: 10px !important;
    }
    .eval-report-page--capture .eval-report-design-card > * + *,
    .eval-report-page--capture .eval-report-assessment-card > * + * {
      margin-top: ${t.section.blockGapPx}px !important;
    }
    .eval-report-page--capture .eval-report-auth-card,
    .eval-report-page--capture .eval-report-condition-card,
    .eval-report-page--capture .eval-report-recommendation,
    .eval-report-page--capture .eval-report-field-block {
      display: block !important;
      height: auto !important;
      min-height: 0 !important;
    }
    .eval-report-page--capture .eval-report-assessment-top,
    .eval-report-page--capture .eval-report-kv-row,
    .eval-report-page--capture .eval-report-stat-row,
    .eval-report-page--capture .eval-report-summary-row,
    .eval-report-page--capture .eval-report-coin-header {
      display: flex !important;
      flex-direction: row !important;
      align-items: flex-start !important;
      justify-content: space-between !important;
      gap: 16px !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
    }
    .eval-report-page--capture .eval-report-assessment-top {
      align-items: center !important;
      gap: 20px !important;
    }
    .eval-report-page--capture .eval-report-summary-row {
      align-items: center !important;
      gap: 12px !important;
      justify-content: flex-start !important;
    }
    .eval-report-page--capture .eval-report-summary-label {
      flex: 1 1 auto !important;
      min-width: 0 !important;
    }
    .eval-report-page--capture .eval-report-summary-value {
      flex: 0 0 auto !important;
      margin-left: auto !important;
    }
    .eval-report-page--capture .eval-report-kv-label,
    .eval-report-page--capture .eval-report-stat-label {
      flex: 1 1 auto !important;
      min-width: 0 !important;
    }
    .eval-report-page--capture .eval-report-kv-value,
    .eval-report-page--capture .eval-report-stat-value {
      flex: 0 0 auto !important;
      margin-left: auto !important;
    }
    .eval-report-page--capture .eval-report-kv-row {
      padding: ${t.section.rowPaddingYPx}px ${t.section.rowPaddingXPx}px !important;
    }
    .eval-report-page--capture .eval-report-stat-row {
      padding: 12px 0 !important;
    }
    .eval-report-page--capture .eval-report-field-value {
      margin-top: 6px !important;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif !important;
    }
    .eval-report-page--capture .eval-report-field-value--grade {
      font-weight: 600 !important;
    }
    .eval-report-page--capture .eval-report-field-value--body,
    .eval-report-page--capture .eval-report-auth-note {
      font-weight: 400 !important;
      line-height: 1.6 !important;
    }
    .eval-report-page--capture .eval-report-auth-note {
      margin-top: 12px !important;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif !important;
    }
    .eval-report-page--capture .eval-report-auth-badge,
    .eval-report-page--capture .eval-report-rarity-badge {
      display: inline-block !important;
      box-sizing: border-box !important;
      text-align: center !important;
      white-space: nowrap !important;
      vertical-align: middle !important;
      flex: 0 0 auto !important;
    }
    .eval-report-page--capture .eval-report-auth-badge {
      height: 26px !important;
      min-height: 26px !important;
      max-height: 26px !important;
      padding: 0 16px !important;
      line-height: 26px !important;
      min-width: 88px !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      border-radius: 999px !important;
    }
    .eval-report-page--capture .eval-report-rarity-badge {
      padding: 5px 12px !important;
      line-height: 16px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border-radius: 999px !important;
    }
    .eval-report-page--capture .eval-report-chip {
      display: inline-block !important;
      box-sizing: border-box !important;
      padding: 5px 12px !important;
      line-height: 16px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      text-align: center !important;
      white-space: nowrap !important;
      border-radius: 999px !important;
      vertical-align: middle !important;
      flex: 0 0 auto !important;
    }
    .eval-report-page--capture .eval-report-chip-row {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;
      gap: 8px !important;
    }
    .eval-report-page--capture .eval-report-section-heading {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      margin-bottom: ${t.section.headingGapPx}px !important;
    }
    .eval-report-page--capture .eval-report-section-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }
    .eval-report-page--capture .eval-report-hero-profile,
    .eval-report-page--capture .eval-report-coin-gallery {
      display: flex !important;
      align-items: center !important;
    }
    .eval-report-page--capture .eval-report-coin-gallery {
      align-items: center !important;
    }
    .eval-report-page--capture .eval-report-footer {
      display: flex !important;
      flex-direction: row !important;
      align-items: flex-end !important;
      justify-content: space-between !important;
      gap: 24px !important;
    }
  `;
}
