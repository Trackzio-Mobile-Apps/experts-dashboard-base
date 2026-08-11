import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
  className?: string;
  /** Page backdrop: warm canvas (default) or near-black (e.g. expert sign-up). */
  canvas?: "default" | "dark" | "expert";
};

const canvasClass: Record<NonNullable<AuthLayoutProps["canvas"]>, string> = {
  default: "bg-canvas",
  dark: "bg-[#0c0c0c]",
  expert: "bg-expert-dashboard-canvas",
};

/**
 * Full-viewport auth shell: centered content on canvas or dark backdrop.
 */
export function AuthLayout({
  children,
  className = "",
  canvas = "default",
}: AuthLayoutProps) {
  return (
    <div
      className={`flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 ${canvasClass[canvas]} ${className}`}
    >
      {children}
    </div>
  );
}
