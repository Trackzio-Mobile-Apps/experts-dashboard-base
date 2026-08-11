type ExpandMediaGalleryIconProps = {
  className?: string;
};

/** Diagonal expand icon for the coin media gallery header (matches Figma). */
export function ExpandMediaGalleryIcon({
  className = "h-4 w-4",
}: ExpandMediaGalleryIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M7 17 17 7" />
      <path d="M7 17H4" />
      <path d="M7 17V20" />
      <path d="M17 7H20" />
      <path d="M17 7V4" />
    </svg>
  );
}
