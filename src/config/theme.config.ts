/**
 * White-label theme defaults.
 *
 * Brand name / logo / title are overridden by `APP_*` env vars
 * (`src/config/appEnv.ts`). Colors, fonts, and buttons stay here.
 *
 * Applied at startup by `applyTheme()` in `main.tsx`.
 */

import { appEnv } from "@/config/appEnv";

const defaultThemeConfig = {
  brand: {
    name: "Expert",
    appTitle: "Expert Portal",
    logoSrc: "/coinzy-logo.png",
    logoAlt: "Expert",
    faviconSrc: "/favicon.png",
    reportName: "Expert",
    portalLabels: {
      expert: "Expert Portal",
      client: "Client Portal",
    },
    panelSubtitle: "Expert panel",
  },

  fonts: {
    /** CSS font-family for body UI */
    sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
    /** Optional display font (reports / headings) */
    display: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    /** Google Fonts stylesheet — change family query when swapping fonts */
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
  },

  colors: {
    canvas: "#f5f3f0",
    surface: "#ffffff",

    primary: "#7c3c3f",
    primaryHover: "#682f2f",
    primaryActive: "#5a2929",
    primarySoft: "#f3e8e8",

    secondary: "#c2620e",
    secondaryHover: "#a4520b",
    secondaryActive: "#8a4509",
    secondarySoft: "#fff7ed",

    text: "#111111",
    textMuted: "#6b7280",
    border: "#e5e2dc",
    inputBg: "#f9fafb",
    inputBorder: "#e6e9eb",

    logoBg: "#1c1917",
    logoAccent: "#4ade80",
    successRing: "#e8f5e9",
    successCheck: "#2e7d32",

    expertSidebar: "#823f42",
    expertSidebarForeground: "#f8f6f4",
    expertSidebarMuted: "rgba(248, 246, 244, 0.65)",
    expertDashboardCanvas: "#f6f7f8",
    expertNavBadge: "#f97316",
    expertAvailable: "#22c55e",
    expertStatusActive: "#4ade80",
    expertStatusInactive: "#fbbf24",

    expertActionGreen: "#16a34a",
    expertActionGreenHover: "#15803d",
    expertActionGreenSoft: "#e8f8ef",
    expertActionGreenText: "#166534",
    expertActionGreenRing: "rgba(22, 163, 74, 0.22)",

    expertActionBlue: "#3b82f6",
    expertActionBlueHover: "#2563eb",
    expertActionBlueSoft: "#eff6ff",
    expertActionBlueText: "#1d4ed8",
    expertActionBlueRing: "rgba(59, 130, 246, 0.25)",

    expertActionAmber: "#eab308",
    expertActionAmberHover: "#ca8a04",
    expertActionAmberSoft: "#fef3c7",
    expertActionAmberText: "#92400e",
    expertActionAmberRing: "rgba(234, 179, 8, 0.45)",

    expertActionOrange: "#c2620e",
    expertActionOrangeHover: "#a4520b",

    expertBadgeNeutral: "#eef6ff",
    expertBadgeNeutralText: "#51a2ff",
    expertBadgeNeutralRing: "rgba(81, 162, 255, 0.25)",

    expertStatusDraftBg: "#f3f4f6",
    expertStatusDraftText: "#4b5563",
    expertStatusNewBg: "#fef9c3",
    expertStatusNewText: "#a16207",
    expertStatusDoneBg: "#ecfdf5",
    expertStatusDoneText: "#15803d",
    expertStatusExpiredBg: "#fff1eb",
    expertStatusExpiredText: "#c2410c",

    expertError: "#dc2626",
    expertErrorSoft: "#fef2f2",

    expertDraftBanner: "#ecfdf5",
    expertDraftBannerBorder: "#bbf7d0",
    expertDraftBannerText: "#166534",
  },

  buttons: {
    sizes: {
      sm: {
        height: "1.75rem",
        paddingX: "1.75rem",
        fontSize: "0.75rem",
        fontWeight: "600",
        radius: "0.5rem",
        minWidth: "",
      },
      md: {
        height: "2.5rem",
        paddingX: "1rem",
        fontSize: "0.875rem",
        fontWeight: "600",
        radius: "0.5rem",
        minWidth: "8.5rem",
      },
      lg: {
        height: "auto",
        paddingX: "1rem",
        paddingY: "0.75rem",
        fontSize: "0.875rem",
        fontWeight: "600",
        radius: "9999px",
        minWidth: "",
      },
    },
    variants: {
      primary: {
        bg: "bg-primary",
        hover: "hover:bg-primary-hover",
        active: "active:bg-primary-active",
        text: "text-white",
        border: "",
      },
      secondary: {
        bg: "bg-secondary",
        hover: "hover:bg-secondary-hover",
        active: "active:bg-secondary-active",
        text: "text-white",
        border: "",
      },
      outline: {
        bg: "bg-white",
        hover: "hover:bg-primary/[0.04]",
        active: "",
        text: "text-primary",
        border: "border border-primary",
      },
      ghost: {
        bg: "bg-transparent",
        hover: "hover:bg-primary-soft",
        active: "",
        text: "text-primary",
        border: "",
      },
      success: {
        bg: "bg-expert-action-green",
        hover: "hover:bg-expert-action-green-hover",
        active: "",
        text: "text-white",
        border: "",
      },
      info: {
        bg: "bg-expert-action-blue",
        hover: "hover:bg-expert-action-blue-hover",
        active: "",
        text: "text-white",
        border: "",
      },
    },
  },

  icons: {
    nav: {
      sizePx: 18,
      strokeWidth: 1.75,
      queueSrc: "/expert-nav-queue-icon.png",
    },
    logo: {
      sizePx: 40,
      radius: "0.5rem",
    },
  },

  /** Evaluation / PDF report copy (brand colors still come from `colors`) */
  report: {
    subtitle: "Expert Evaluation",
    title: "Evaluation Report",
    layoutVersion: "v1" as "v1" | "v2",
  },
} as const;

export const themeConfig = {
  ...defaultThemeConfig,
  brand: {
    ...defaultThemeConfig.brand,
    name: appEnv.name || defaultThemeConfig.brand.name,
    appTitle: appEnv.title || defaultThemeConfig.brand.appTitle,
    logoSrc: appEnv.logoUrl || defaultThemeConfig.brand.logoSrc,
    logoAlt: appEnv.name || defaultThemeConfig.brand.logoAlt,
    faviconSrc: appEnv.faviconUrl || defaultThemeConfig.brand.faviconSrc,
    reportName: appEnv.reportName || defaultThemeConfig.brand.reportName,
  },
};

export type ThemeConfig = typeof defaultThemeConfig;
export type ButtonSize = keyof typeof defaultThemeConfig.buttons.sizes;
export type ButtonVariant = keyof typeof defaultThemeConfig.buttons.variants;
