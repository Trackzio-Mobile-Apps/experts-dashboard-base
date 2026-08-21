/**
 * Apply `themeConfig` to CSS variables (and fonts / title / favicon).
 * Call once before React mounts.
 */

import { themeConfig } from "@/config/theme.config";

function toBrandCssVar(key: string): string {
  return `--brand-${key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)}`;
}

function applyFonts(config: typeof themeConfig): void {
  const { fonts, brand } = config;
  const root = document.documentElement;

  root.style.setProperty("--font-app-sans", fonts.sans);
  root.style.setProperty("--font-app-display", fonts.display);
  root.style.setProperty("--font-app-mono", fonts.mono);
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

export function applyTheme(
  config: typeof themeConfig = themeConfig,
  target: HTMLElement = document.documentElement,
): void {
  const { colors, icons, buttons } = config;

  for (const [key, value] of Object.entries(colors)) {
    if (value != null) {
      target.style.setProperty(toBrandCssVar(key), value);
    }
  }

  target.style.setProperty("--brand-logo-size", `${icons.logo.sizePx}px`);
  target.style.setProperty("--brand-logo-radius", icons.logo.radius);
  target.style.setProperty("--brand-nav-icon-size", `${icons.nav.sizePx}px`);

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
