"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type QueueCoinPreviewProps = {
  coinName: string;
  thumbnailUrls: string[];
};

/** Queue thumb: circular coin previews. */
const thumbClass =
  "h-[100px] w-[100px] shrink-0 rounded-full object-cover bg-input-bg";

function CoinPairInitials({ label }: { label: string }) {
  return (
    <div
      className="flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-500 to-amber-900 text-sm font-bold text-white"
      aria-hidden
    >
      {label.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function QueueCoinPreview({
  coinName,
  thumbnailUrls,
}: QueueCoinPreviewProps) {
  const urls = useMemo(
    () =>
      thumbnailUrls
        .map((url) => url.trim())
        .filter(Boolean)
        .slice(0, 2),
    [thumbnailUrls],
  );

  const [failed, setFailed] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    setFailed(new Set());
  }, [urls]);

  const markFailed = useCallback((index: number) => {
    setFailed((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const visibleUrls = urls.filter((_, index) => !failed.has(index));

  if (visibleUrls.length === 0) {
    return <CoinPairInitials label={coinName} />;
  }

  if (visibleUrls.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote coin media URLs
      <img
        src={visibleUrls[0]}
        alt={coinName}
        className={thumbClass}
        onError={() => markFailed(urls.indexOf(visibleUrls[0]!))}
      />
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-3" aria-hidden>
      {visibleUrls.map((src) => {
        const sourceIndex = urls.indexOf(src);
        return (
          // eslint-disable-next-line @next/next/no-img-element -- remote coin media URLs
          <img
            key={`${sourceIndex}-${src}`}
            src={src}
            alt=""
            className={thumbClass}
            onError={() => markFailed(sourceIndex)}
          />
        );
      })}
    </div>
  );
}
