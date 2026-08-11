import type { ButtonHTMLAttributes, ReactNode } from "react";
import { getButtonClass, type ButtonVariant, type ButtonSize } from "@/config";

export type PrimaryButtonProps = {
  children: ReactNode;
  /** Defaults to primary. Use `secondary` for the second brand color. */
  variant?: ButtonVariant;
  /** Defaults to lg (auth pill). */
  size?: ButtonSize;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Shared CTA. Colors and sizes come from `src/config/theme.config.ts`.
 */
export function PrimaryButton({
  children,
  className = "",
  type = "button",
  variant = "primary",
  size = "lg",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={getButtonClass({
        variant,
        size,
        fullWidth: size === "lg",
        className,
      })}
      {...props}
    >
      {children}
    </button>
  );
}
