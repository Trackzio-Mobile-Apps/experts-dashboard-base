import { themeConfig } from "@/config";

/**
 * Evaluation report layout tokens — aligned to Figma "Report - coin authentic".
 * Brand primary / logo colors follow `src/config/theme.config.ts`.
 */
export const EVALUATION_REPORT_TOKENS = {
  page: {
    /** Figma frame width (border-outer) */
    maxWidthPx: 571,
    paddingXPx: 24,
    paddingYPx: 24,
    rowGapPx: 16,
  },
  colors: {
    /** Page and hero card background */
    canvas: "#FFFFFF",
    text: "#1A1A1A",
    textMuted: "#6B6560",
    labelMuted: "#8A847C",
    /** Brand accent — kicker, section titles, avatar */
    primary: themeConfig.colors.primary,
    border: "#E7E5E4",
    inputBg: "#F5F3EE",
    /** Nested white stats box inside expert card */
    statBoxBg: "#FFFFFF",
    statBoxBorder: "#E7E5E4",
    /** White panels (key-value cards, stat box) */
    surface: "#FFFFFF",
    /** Hero / nested panels on the report page */
    cardBg: "#FFFFFF",
    logoBg: themeConfig.colors.logoBg,
    expertAvatarBg: themeConfig.colors.primary,
    expertAvatarText: "#FFFFFF",
    /** Coin hero summary strip — shared label color */
    summaryLabel: "#1A1A1A",
    /** global/green/10 + value text (Authentic) */
    summaryAuthenticBg: "#E8FAF0",
    summaryAuthenticValue: "#0E835B",
    /** global/yellow/10 + value text (Doubtful) */
    summaryDoubtfulBg: "#FFF9E6",
    summaryDoubtfulValue: "#C86B00",
    /** global/red/10 + value text (Fake) */
    summaryFakeBg: "#FFF3F0",
    summaryFakeValue: "#8A1700",
    /** Pending / unknown authenticity */
    summaryNeutralBg: "#F5F3EE",
    summaryNeutralValue: "#6B6560",
    /** Condition grade tint inside Expert Assessment (Authentic only) */
    conditionBg: "#FFF7ED",
    rarityBg: "#FDF2B3",
    rarityText: "#967117",
    /** Expertise chips — light beige + gray text */
    chipBg: "#EDE8DF",
    chipText: "#6B6560",
    expertiseKicker: "#8A847C",
    /** Expert Assessment — Authentic tone */
    assessmentAuthenticCardBg: "#E8FAF0",
    assessmentAuthenticBadgeBg: "#00C853",
    /** Expert Assessment — Fake tone */
    assessmentFakeCardBg: "#FFF3F0",
    assessmentFakeBadgeBg: "#8A1700",
    /** Expert Assessment — Doubtful tone */
    assessmentDoubtfulCardBg: "#FFF9E6",
    assessmentDoubtfulBadgeBg: "#C86B00",
    assessmentBadgeText: "#FFFFFF",
    star: "#1A1A1A",
    /** v1 hero card — warm beige panel behind coin + summary */
    heroV1CardBg: "#FAF8F5",
    heroV1SummaryLabel: "#6B6560",
  },
  header: {
    logoSizePx: 40,
    logoRadiusPx: 8,
    paddingTopPx: 24,
    paddingBottomPx: 24,
    brandGapPx: 12,
    reportTitleSizePx: 18,
    metaSizePx: 11,
  },
  hero: {
    gapPx: 16,
    marginTopPx: 0,
    cardRadiusPx: 12,
    cardPaddingPx: 16,
    cardBorderPx: 1,
    avatarSizePx: 48,
    coinImageSizePx: 48,
    coinImageOverlapPx: 12,
    /** v1 hero — compact overlapping coin thumbnails (Figma hero-row) */
    v1CoinImageSizePx: 44,
    v1CoinImageOverlapPx: 11,
  },
  section: {
    gapPx: 16,
    marginTopPx: 0,
    iconSizePx: 24,
    cardRadiusPx: 8,
    rowPaddingYPx: 10,
    rowPaddingXPx: 14,
    headingGapPx: 12,
    blockGapPx: 12,
  },
  footer: {
    marginTopPx: 0,
    paddingTopPx: 24,
    fontSizePx: 10,
  },
  pdf: {
    /** Scaled to Figma frame; A4 height for multi-page export */
    pageWidthPx: 571,
    pageHeightPx: 1123,
    /** Figma page-1 frame (header → design details) */
    page1HeightPx: 818,
    /** Figma page-2 frame (header → expert assessment) */
    page2HeightPx: 818,
    pagePaddingPx: 24,
    headerPaddingBottomPx: 24,
    heroMarginTopPx: 0,
    heroGapPx: 16,
    heroCardPaddingPx: 16,
    heroAvatarSizePx: 44,
    heroCoinImageSizePx: 44,
    sectionMarginTopPx: 0,
    sectionGapPx: 16,
    sectionHeadingGapPx: 12,
    kvRowPaddingYPx: 10,
    kvRowPaddingXPx: 14,
    kvFontSizePx: 12,
    designBlockMarginTopPx: 0,
    assessmentBlockMarginTopPx: 0,
    footerPaddingTopPx: 24,
  },
} as const;

export type AuthenticityTone = "authentic" | "doubtful" | "fake" | "neutral";

export function authenticityTone(value: string): AuthenticityTone {
  const normalized = value.trim().toLowerCase();
  if (normalized === "authentic") return "authentic";
  if (normalized === "doubtful") return "doubtful";
  if (normalized === "fake") return "fake";
  return "neutral";
}

export function authenticityAssessmentTheme(tone: AuthenticityTone): {
  cardBg: string;
  badgeBg: string;
  badgeText: string;
  showConditionTint: boolean;
} {
  const { colors } = EVALUATION_REPORT_TOKENS;
  switch (tone) {
    case "authentic":
      return {
        cardBg: colors.assessmentAuthenticCardBg,
        badgeBg: colors.assessmentAuthenticBadgeBg,
        badgeText: colors.assessmentBadgeText,
        showConditionTint: true,
      };
    case "fake":
      return {
        cardBg: colors.assessmentFakeCardBg,
        badgeBg: colors.assessmentFakeBadgeBg,
        badgeText: colors.assessmentBadgeText,
        showConditionTint: false,
      };
    case "doubtful":
      return {
        cardBg: colors.assessmentDoubtfulCardBg,
        badgeBg: colors.assessmentDoubtfulBadgeBg,
        badgeText: colors.assessmentBadgeText,
        showConditionTint: false,
      };
    default:
      return {
        cardBg: colors.inputBg,
        badgeBg: colors.labelMuted,
        badgeText: colors.assessmentBadgeText,
        showConditionTint: false,
      };
  }
}

export function authenticityBadgeColors(tone: AuthenticityTone): {
  bg: string;
  text: string;
  border: string;
} {
  const theme = authenticityAssessmentTheme(tone);
  return {
    bg: theme.badgeBg,
    text: theme.badgeText,
    border: theme.badgeBg,
  };
}

/** Coin hero summary box — bg + accent text/icons by authenticity tone. */
export function authenticitySummaryTheme(tone: AuthenticityTone): {
  boxBg: string;
  accentColor: string;
  labelColor: string;
} {
  const { colors } = EVALUATION_REPORT_TOKENS;
  switch (tone) {
    case "authentic":
      return {
        boxBg: colors.summaryAuthenticBg,
        accentColor: colors.summaryAuthenticValue,
        labelColor: colors.summaryLabel,
      };
    case "doubtful":
      return {
        boxBg: colors.summaryDoubtfulBg,
        accentColor: colors.summaryDoubtfulValue,
        labelColor: colors.summaryLabel,
      };
    case "fake":
      return {
        boxBg: colors.summaryFakeBg,
        accentColor: colors.summaryFakeValue,
        labelColor: colors.summaryLabel,
      };
    default:
      return {
        boxBg: colors.summaryNeutralBg,
        accentColor: colors.summaryNeutralValue,
        labelColor: colors.summaryLabel,
      };
  }
}
