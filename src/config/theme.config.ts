/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THEME CONFIG — edit THIS file to rebrand / restyle the app for a new project
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Change in one place:
 *   • brand name + logo
 *   • primary / secondary (and related) colors
 *   • button sizes, radius, and colors
 *   • icon sizes and asset paths
 *
 * Applied at startup via `applyTheme()` in `main.tsx`.
 * Tailwind classes like `bg-primary` / `bg-secondary` read these CSS variables.
 */

export const themeConfig = {
  /* ── Brand ─────────────────────────────────────────────────────────────── */
  brand: {
    /** Wordmark next to the logo */
    name: "Coinzy",
    /** Document / browser tab title prefix */
    appTitle: "Coinzy Expert Portal",
    /** Path under /public — replace this file to rebrand */
    logoSrc: "/coinzy-logo.png",
    logoAlt: "Coinzy",
    /** Evaluation / CERT report header name */
    reportName: "Coinzy AI",
    portalLabels: {
      expert: "Expert Portal",
      client: "Client Portal",
    },
    panelSubtitle: "Expert panel",
  },

  /* ── Colors (hex) ──────────────────────────────────────────────────────── */
  colors: {
    canvas: "#f5f3f0",
    surface: "#ffffff",

    /** Main brand — CTAs, links, accents */
    primary: "#7c3c3f",
    primaryHover: "#682f2f",
    primaryActive: "#5a2929",
    primarySoft: "#f3e8e8",

    /** Second brand color — secondary buttons, accents */
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

    /* Expert panel */
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

  /* ── Buttons ───────────────────────────────────────────────────────────── */
  buttons: {
    /**
     * Size presets used by `getButtonClass()`.
     * Edit height / padding / font / radius here — all shared buttons follow.
     */
    sizes: {
      sm: {
        height: "1.75rem", // 28px — table row actions
        paddingX: "1.75rem",
        fontSize: "0.75rem",
        fontWeight: "600",
        radius: "0.5rem",
        minWidth: "",
      },
      md: {
        height: "2.5rem", // 40px — queue / draft CTAs
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
        radius: "9999px", // pill — auth CTAs
        minWidth: "",
      },
    },

    /**
     * Color variants. Uses Tailwind token names mapped in globals.css
     * (`primary`, `secondary`, `expert-action-green`, …).
     */
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

  /* ── Icons ─────────────────────────────────────────────────────────────── */
  icons: {
    /** Sidebar / nav icons */
    nav: {
      sizePx: 18,
      strokeWidth: 1.75,
      /** Raster asset for queue nav (under /public). Replace to rebrand. */
      queueSrc: "/expert-nav-queue-icon.png",
    },
    /** Brand mark next to wordmark */
    logo: {
      sizePx: 40,
      radius: "0.5rem",
    },
  },
} as const;

export type ThemeConfig = typeof themeConfig;
export type ButtonSize = keyof typeof themeConfig.buttons.sizes;
export type ButtonVariant = keyof typeof themeConfig.buttons.variants;
