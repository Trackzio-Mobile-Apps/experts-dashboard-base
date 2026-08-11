/**
 * Public theme API — rebrand by editing `theme.config.ts` only.
 */
export { themeConfig } from "@/config/theme.config";
export type {
  ThemeConfig,
  ButtonSize,
  ButtonVariant,
} from "@/config/theme.config";

export { applyTheme } from "@/config/applyTheme";

export {
  getButtonClass,
  primaryButtonClass,
  solidActionButtonClass,
  outlineActionButtonClass,
  queuePrimaryButtonClass,
  draftContinueButtonClass,
} from "@/config/buttonStyles";
export type { GetButtonClassOptions } from "@/config/buttonStyles";
