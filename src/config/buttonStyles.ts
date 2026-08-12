import {
  themeConfig,
  type ButtonSize,
  type ButtonVariant,
} from "@/config/theme.config";

/** Size shells use CSS vars from applyTheme() — keep as full string literals for Tailwind. */
const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-[var(--btn-sm-height)] px-[var(--btn-sm-px)] text-[length:var(--btn-sm-font)] rounded-[var(--btn-sm-radius)] font-semibold",
  md: "h-[var(--btn-md-height)] min-w-[var(--btn-md-min-w,8.5rem)] px-[var(--btn-md-px)] text-[length:var(--btn-md-font)] rounded-[var(--btn-md-radius)] font-semibold",
  lg: "px-[var(--btn-lg-px)] py-[var(--btn-lg-py)] text-[length:var(--btn-lg-font)] rounded-[var(--btn-lg-radius)] font-semibold",
};

const BASE_CLASS =
  "inline-flex items-center justify-center whitespace-nowrap text-center shadow-sm transition-colors disabled:pointer-events-none disabled:opacity-50";

function variantClasses(variant: ButtonVariant): string {
  const v = themeConfig.buttons.variants[variant];
  return [v.bg, v.hover, v.active, v.text, v.border].filter(Boolean).join(" ");
}

export type GetButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  colorless?: boolean;
  fullWidth?: boolean;
  className?: string;
};

export function getButtonClass({
  variant = "primary",
  size = "md",
  colorless = false,
  fullWidth = false,
  className = "",
}: GetButtonClassOptions = {}): string {
  return [
    BASE_CLASS,
    SIZE_CLASS[size],
    colorless ? "text-white" : variantClasses(variant),
    fullWidth ? "w-full" : "w-fit",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export const primaryButtonClass = getButtonClass({
  variant: "primary",
  size: "lg",
  fullWidth: true,
});

export const solidActionButtonClass = getButtonClass({
  variant: "primary",
  size: "sm",
});

export const outlineActionButtonClass = getButtonClass({
  variant: "outline",
  size: "sm",
});

export const queuePrimaryButtonClass = getButtonClass({
  size: "md",
  colorless: true,
});

export const draftContinueButtonClass = getButtonClass({
  size: "md",
  colorless: true,
  className: "min-w-[7.5rem] px-5 py-2.5 h-auto",
});
