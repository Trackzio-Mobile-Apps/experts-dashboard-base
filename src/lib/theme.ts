/**
 * TypeScript color mirror for non-CSS contexts (charts, canvas, PDF).
 * Source of truth: `src/config/theme.config.ts`.
 */
import { themeConfig } from "@/config/theme.config";

export const brandColors = {
  canvas: themeConfig.colors.canvas,
  surface: themeConfig.colors.surface,
  primary: themeConfig.colors.primary,
  primaryHover: themeConfig.colors.primaryHover,
  primaryActive: themeConfig.colors.primaryActive,
  primarySoft: themeConfig.colors.primarySoft,
  secondary: themeConfig.colors.secondary,
  secondaryHover: themeConfig.colors.secondaryHover,
  secondaryActive: themeConfig.colors.secondaryActive,
  secondarySoft: themeConfig.colors.secondarySoft,
  text: themeConfig.colors.text,
  textMuted: themeConfig.colors.textMuted,
  border: themeConfig.colors.border,
  inputBg: themeConfig.colors.inputBg,
  inputBorder: themeConfig.colors.inputBorder,
  logoBg: themeConfig.colors.logoBg,
  logoAccent: themeConfig.colors.logoAccent,
  successRing: themeConfig.colors.successRing,
  successCheck: themeConfig.colors.successCheck,
} as const;

export { themeConfig } from "@/config/theme.config";
