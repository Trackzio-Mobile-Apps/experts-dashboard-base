import { themeConfig } from "@/config";

type LogoProps = {
  className?: string;
  /** Subtitle under the brand wordmark. */
  portal?: "expert" | "client";
};

function Mark() {
  const { brand, icons } = themeConfig;
  return (
    <img
      src={brand.logoSrc}
      alt={brand.logoAlt}
      width={icons.logo.sizePx}
      height={icons.logo.sizePx}
      className="h-[var(--coinzy-logo-size)] w-[var(--coinzy-logo-size)] rounded-[var(--coinzy-logo-radius)] bg-black object-cover shadow-sm ring-1 ring-black/10"
    />
  );
}

/**
 * Brand lockup: mark + name + portal line.
 * Edit name / logo in `src/config/theme.config.ts`.
 */
export function Logo({ className = "", portal = "expert" }: LogoProps) {
  const { brand } = themeConfig;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="flex shrink-0" aria-hidden>
        <Mark />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-semibold tracking-tight text-text">
          {brand.name}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted">
          {brand.portalLabels[portal]}
        </span>
      </div>
    </div>
  );
}
