import { Link } from "@/lib/router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type TextLinkProps = {
  children: ReactNode;
  href: string;
  className?: string;
  external?: boolean;
  /** Strong style for inline CTAs like “Create account”. */
  variant?: "muted" | "strong" | "accent";
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">;

const variants = {
  muted:
    "text-sm font-medium text-text-muted underline-offset-4 transition-colors hover:text-text hover:underline",
  strong:
    "text-sm font-semibold text-text underline-offset-4 transition-colors hover:underline",
  accent:
    "text-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary-hover hover:underline",
};

/**
 * Muted inline link for secondary actions (Forgot password, Back to sign in).
 */
export function TextLink({
  children,
  href,
  className = "",
  external,
  variant = "muted",
  ...rest
}: TextLinkProps) {
  const styles = `${variants[variant]} ${className}`;

  if (external) {
    return (
      <a
        href={href}
        className={styles}
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={styles} {...rest}>
      {children}
    </Link>
  );
}
