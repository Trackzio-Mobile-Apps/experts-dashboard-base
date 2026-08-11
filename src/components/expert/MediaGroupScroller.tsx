"use client";

import type { RequestMediaItem } from "@/lib/expert/types";
import { useCallback, useEffect, useRef, useState } from "react";

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

type MediaGroupScrollerProps = {
  items: Array<{ item: RequestMediaItem; index: number }>;
  onOpen: (index: number) => void;
};

function MediaThumbnail({
  item,
  onClick,
  className = "",
}: {
  item: RequestMediaItem;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-lg border border-border/80 bg-input-bg text-left shadow-sm outline-none transition-[box-shadow,ring-color] focus-visible:ring-2 focus-visible:ring-primary/30 ${className}`}
    >
      {item.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.src}
          alt={item.alt}
          className="h-full w-full object-contain bg-input-bg transition-transform duration-200 group-hover:scale-[1.03]"
        />
      ) : (
        <>
          {item.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.poster}
              alt={item.alt}
              className="h-full w-full object-contain bg-neutral-900 transition-transform duration-200 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-neutral-900 text-[10px] font-semibold text-white">
              Video
            </span>
          )}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-[10px] text-white shadow">
              ▶
            </span>
          </span>
          {item.duration ? (
            <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[9px] font-semibold text-white">
              {item.duration}
            </span>
          ) : null}
        </>
      )}
    </button>
  );
}

export function MediaGroupScroller({ items, onOpen }: MediaGroupScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      setCanScrollRight(false);
      return;
    }
    setCanScrollRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [items.length, updateScrollState]);

  const scrollRight = () => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.75, behavior: "smooth" });
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2 min-[420px]:grid-cols-4 sm:hidden">
        {items.map(({ item: m, index: i }) => (
          <MediaThumbnail
            key={i}
            item={m}
            onClick={() => onOpen(i)}
            className="aspect-square w-full"
          />
        ))}
      </div>

      <div className="relative hidden min-w-0 max-w-full sm:block">
        <div
          ref={scrollerRef}
          className="flex max-w-full gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map(({ item: m, index: i }) => (
            <MediaThumbnail
              key={i}
              item={m}
              onClick={() => onOpen(i)}
              className="h-[4.5rem] w-[4.5rem] shrink-0"
            />
          ))}
        </div>

        {canScrollRight ? (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-surface via-surface/80 to-transparent"
              aria-hidden
            />
            <button
              type="button"
              onClick={scrollRight}
              className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-md transition-colors hover:bg-black/70"
              aria-label="Scroll media row"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </>
        ) : null}
      </div>
    </>
  );
}
