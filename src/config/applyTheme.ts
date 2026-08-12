import { themeConfig } from "@/config/theme.config";

const COLOR_CSS_VARS: Record<keyof typeof themeConfig.colors, string> = {
  canvas: "--coinzy-canvas",
  surface: "--coinzy-surface",
  primary: "--coinzy-primary",
  primaryHover: "--coinzy-primary-hover",
  primaryActive: "--coinzy-primary-active",
  primarySoft: "--coinzy-primary-soft",
  secondary: "--coinzy-secondary",
  secondaryHover: "--coinzy-secondary-hover",
  secondaryActive: "--coinzy-secondary-active",
  secondarySoft: "--coinzy-secondary-soft",
  text: "--coinzy-text",
  textMuted: "--coinzy-text-muted",
  border: "--coinzy-border",
  inputBg: "--coinzy-input-bg",
  inputBorder: "--coinzy-input-border",
  logoBg: "--coinzy-logo-bg",
  logoAccent: "--coinzy-logo-accent",
  successRing: "--coinzy-success-ring",
  successCheck: "--coinzy-success-check",
  expertSidebar: "--coinzy-expert-sidebar",
  expertSidebarForeground: "--coinzy-expert-sidebar-foreground",
  expertSidebarMuted: "--coinzy-expert-sidebar-muted",
  expertDashboardCanvas: "--coinzy-expert-dashboard-canvas",
  expertNavBadge: "--coinzy-expert-nav-badge",
  expertAvailable: "--coinzy-expert-available",
  expertStatusActive: "--coinzy-expert-status-active",
  expertStatusInactive: "--coinzy-expert-status-inactive",
  expertActionGreen: "--coinzy-expert-action-green",
  expertActionGreenHover: "--coinzy-expert-action-green-hover",
  expertActionGreenSoft: "--coinzy-expert-action-green-soft",
  expertActionGreenText: "--coinzy-expert-action-green-text",
  expertActionGreenRing: "--coinzy-expert-action-green-ring",
  expertActionBlue: "--coinzy-expert-action-blue",
  expertActionBlueHover: "--coinzy-expert-action-blue-hover",
  expertActionBlueSoft: "--coinzy-expert-action-blue-soft",
  expertActionBlueText: "--coinzy-expert-action-blue-text",
  expertActionBlueRing: "--coinzy-expert-action-blue-ring",
  expertActionAmber: "--coinzy-expert-action-amber",
  expertActionAmberHover: "--coinzy-expert-action-amber-hover",
  expertActionAmberSoft: "--coinzy-expert-action-amber-soft",
  expertActionAmberText: "--coinzy-expert-action-amber-text",
  expertActionAmberRing: "--coinzy-expert-action-amber-ring",
  expertActionOrange: "--coinzy-expert-action-orange",
  expertActionOrangeHover: "--coinzy-expert-action-orange-hover",
  expertBadgeNeutral: "--coinzy-expert-badge-neutral",
  expertBadgeNeutralText: "--coinzy-expert-badge-neutral-text",
  expertBadgeNeutralRing: "--coinzy-expert-badge-neutral-ring",
  expertStatusDraftBg: "--coinzy-expert-status-draft-bg",
  expertStatusDraftText: "--coinzy-expert-status-draft-text",
  expertStatusNewBg: "--coinzy-expert-status-new-bg",
  expertStatusNewText: "--coinzy-expert-status-new-text",
  expertStatusDoneBg: "--coinzy-expert-status-done-bg",
  expertStatusDoneText: "--coinzy-expert-status-done-text",
  expertStatusExpiredBg: "--coinzy-expert-status-expired-bg",
  expertStatusExpiredText: "--coinzy-expert-status-expired-text",
  expertError: "--coinzy-expert-error",
  expertErrorSoft: "--coinzy-expert-error-soft",
  expertDraftBanner: "--coinzy-expert-draft-banner",
  expertDraftBannerBorder: "--coinzy-expert-draft-banner-border",
  expertDraftBannerText: "--coinzy-expert-draft-banner-text",
};

function applyFonts(config: typeof themeConfig): void {
  const { fonts, brand } = config;
  const root = document.documentElement;

  root.style.setProperty("--font-app-sans", fonts.sans);
  root.style.setProperty("--font-app-display", fonts.display);
  root.style.setProperty("--font-app-mono", fonts.mono);
  // Back-compat aliases used by globals.css
  root.style.setProperty("--font-geist-sans", fonts.sans);
  root.style.setProperty("--font-plus-jakarta", fonts.display);
  root.style.setProperty("--font-geist-mono", fonts.mono);

  let link = document.getElementById("app-theme-fonts") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = "app-theme-fonts";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (fonts.googleFontsUrl) {
    link.href = fonts.googleFontsUrl;
  }

  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon && brand.faviconSrc) {
    favicon.href = brand.faviconSrc;
  }

  if (brand.appTitle) {
    document.title = brand.appTitle;
  }
}

/**
 * Apply `themeConfig` to CSS variables (and fonts / title / favicon).
 * Call once before React mounts.
 */
export function applyTheme(
  config: typeof themeConfig = themeConfig,
  target: HTMLElement = document.documentElement,
): void {
  const { colors, icons, buttons } = config;

  for (const [key, cssVar] of Object.entries(COLOR_CSS_VARS)) {
    const value = colors[key as keyof typeof colors];
    if (value != null) {
      target.style.setProperty(cssVar, value);
    }
  }

  target.style.setProperty("--coinzy-logo-size", `${icons.logo.sizePx}px`);
  target.style.setProperty("--coinzy-logo-radius", icons.logo.radius);
  target.style.setProperty("--coinzy-nav-icon-size", `${icons.nav.sizePx}px`);

  target.style.setProperty("--btn-sm-height", buttons.sizes.sm.height);
  target.style.setProperty("--btn-sm-px", buttons.sizes.sm.paddingX);
  target.style.setProperty("--btn-sm-radius", buttons.sizes.sm.radius);
  target.style.setProperty("--btn-sm-font", buttons.sizes.sm.fontSize);

  target.style.setProperty("--btn-md-height", buttons.sizes.md.height);
  target.style.setProperty("--btn-md-px", buttons.sizes.md.paddingX);
  target.style.setProperty("--btn-md-radius", buttons.sizes.md.radius);
  target.style.setProperty("--btn-md-font", buttons.sizes.md.fontSize);
  if (buttons.sizes.md.minWidth) {
    target.style.setProperty("--btn-md-min-w", buttons.sizes.md.minWidth);
  }

  const lg = buttons.sizes.lg;
  target.style.setProperty("--btn-lg-px", lg.paddingX);
  target.style.setProperty(
    "--btn-lg-py",
    "paddingY" in lg ? lg.paddingY : "0.75rem",
  );
  target.style.setProperty("--btn-lg-radius", lg.radius);
  target.style.setProperty("--btn-lg-font", lg.fontSize);

  if (typeof document !== "undefined") {
    applyFonts(config);
  }
}
