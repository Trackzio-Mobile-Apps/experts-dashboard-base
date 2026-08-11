import type { SVGProps } from "react";
import { themeConfig } from "@/config";

const { sizePx, strokeWidth, queueSrc } = themeConfig.icons.nav;

const navIconProps = {
  width: sizePx,
  height: sizePx,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

export type ExpertNavIconKind = "queue" | "drafts" | "history" | "profile";

/** Queue — raster asset path from `themeConfig.icons.nav.queueSrc`. */
export function ExpertQueueNavIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <img
      src={queueSrc}
      alt=""
      width={sizePx}
      height={sizePx}
      className={`h-[var(--coinzy-nav-icon-size)] w-[var(--coinzy-nav-icon-size)] shrink-0 brightness-0 invert ${className ?? ""}`}
      aria-hidden
    />
  );
}

/** Drafts — document with open top-right corner and pencil. */
export function ExpertDraftsNavIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...navIconProps} {...props}>
      <path d="M6.25 7.5a1.75 1.75 0 0 1 1.75-1.75H12.75" />
      <path d="M6.25 7.5v10a1.75 1.75 0 0 0 1.75 1.75h8a1.75 1.75 0 0 0 1.75-1.75v-7.75" />
      <path d="M8.25 10.25h3.25" />
      <path d="M8.25 13.75h6.75" />
      <path
        d="M18.6 4.9 14.15 9.35"
        strokeWidth="2.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExpertHistoryNavIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...navIconProps} strokeWidth={2} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ExpertProfileNavIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...navIconProps} strokeWidth={2} {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function ExpertNavIcon({
  kind,
  className,
  ...props
}: { kind: ExpertNavIconKind; className?: string } & SVGProps<SVGSVGElement>) {
  switch (kind) {
    case "queue":
      return <ExpertQueueNavIcon className={className} />;
    case "drafts":
      return <ExpertDraftsNavIcon className={className} {...props} />;
    case "history":
      return <ExpertHistoryNavIcon className={className} {...props} />;
    case "profile":
      return <ExpertProfileNavIcon className={className} {...props} />;
  }
}
