"use client";

import { useEffect, useState } from "react";

/** Non-empty HTTPS URL from `GET /experts/me` → `profilePicture`. */
export function resolveProfilePictureUrl(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol === "https:") return trimmed;
  } catch {
    // Invalid URL — fall back to initials avatar.
  }

  return null;
}

type ExpertAvatarSize = "sm" | "md";

const SIZE_CLASSES: Record<ExpertAvatarSize, string> = {
  sm: "h-9 w-9 text-xs xl:h-12 xl:w-12 xl:text-sm",
  md: "h-20 w-20 text-2xl",
};

type ExpertAvatarProps = {
  profilePicture?: string | null;
  initials: string;
  name?: string;
  size?: ExpertAvatarSize;
  fallbackClassName?: string;
  className?: string;
};

export function ExpertAvatar({
  profilePicture,
  initials,
  name,
  size = "md",
  fallbackClassName = "bg-input-bg text-text-muted",
  className = "",
}: ExpertAvatarProps) {
  const photoUrl = resolveProfilePictureUrl(profilePicture);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [photoUrl]);

  const sizeClass = SIZE_CLASSES[size];
  const rounded = `rounded-full object-cover ${sizeClass} ${className}`.trim();

  if (photoUrl && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name ? `${name} profile photo` : "Profile photo"}
        className={rounded}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClass} ${fallbackClassName} ${className}`.trim()}
      aria-hidden={name ? undefined : true}
    >
      {initials}
    </span>
  );
}
