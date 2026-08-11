import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
  className?: string;
};

/**
 * White elevated panel used on sign-in, forgot-password, etc.
 */
export function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <div
      className={`w-full max-w-md rounded-2xl border border-border/60 bg-surface p-8 shadow-[0_12px_40px_-12px_rgba(17,17,17,0.12)] sm:p-10 ${className}`}
    >
      {children}
    </div>
  );
}
