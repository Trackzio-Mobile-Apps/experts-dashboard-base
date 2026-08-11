"use client";

import type { RequestMediaItem } from "@/lib/expert/types";
import { useCallback, useEffect, useState } from "react";

type EvaluationMediaLightboxProps = {
  items: RequestMediaItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function EvaluationMediaLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: EvaluationMediaLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const current = items[index];

  const clampZoom = useCallback((z: number) => Math.min(2.5, Math.max(1, z)), []);

  useEffect(() => {
    setZoom(1);
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && index < items.length - 1)
        onIndexChange(index + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndexChange]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white">
        <p className="min-w-0 truncate text-sm font-medium">
          {index + 1} / {items.length}
          {current.kind === "video" ? " · Video" : " · Image"}
        </p>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs tabular-nums text-white/70 sm:inline">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="rounded-lg border border-white/25 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => clampZoom(z - 0.25))}
          >
            −
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/25 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => clampZoom(z + 0.25))}
          >
            +
          </button>
          <button
            type="button"
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 text-lg leading-none text-white transition-colors hover:bg-white/10"
            aria-label="Close viewer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-12 sm:px-16">
        <button
          type="button"
          className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg transition-colors hover:bg-black/60 disabled:opacity-30 sm:left-4"
          aria-label="Previous"
          disabled={index <= 0}
          onClick={() => index > 0 && onIndexChange(index - 1)}
        >
          ‹
        </button>

        <div className="flex max-h-full max-w-full items-center justify-center overflow-auto p-4">
          <div
            className="relative transition-transform duration-150 ease-out"
            style={{ transform: `scale(${zoom})` }}
          >
            {current.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote media URLs
              <img
                src={current.src}
                alt={current.alt}
                className="max-h-[min(70vh,720px)] max-w-[min(92vw,920px)] rounded-lg object-contain shadow-2xl"
              />
            ) : (
              <video
                key={current.src}
                src={current.src}
                poster={current.poster || undefined}
                controls
                playsInline
                className="max-h-[min(70vh,720px)] max-w-[min(92vw,920px)] rounded-lg bg-black shadow-2xl"
              >
                {current.alt}
              </video>
            )}
          </div>
        </div>

        <button
          type="button"
          className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg transition-colors hover:bg-black/60 disabled:opacity-30 sm:right-4"
          aria-label="Next"
          disabled={index >= items.length - 1}
          onClick={() =>
            index < items.length - 1 && onIndexChange(index + 1)
          }
        >
          ›
        </button>
      </div>

      <div className="shrink-0 border-t border-white/10 bg-black/50 px-3 py-3">
        <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto pb-1">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onIndexChange(i)}
              className={`relative shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === index
                  ? "border-emerald-400 ring-2 ring-emerald-400/40"
                  : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              {item.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.src}
                  alt=""
                  className="h-14 w-14 object-cover sm:h-16 sm:w-16"
                />
              ) : (
                <>
                  {item.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.poster}
                      alt=""
                      className="h-14 w-14 object-cover sm:h-16 sm:w-16"
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center bg-black text-xs text-white sm:h-16 sm:w-16">
                      ▶
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-xs text-white">
                    ▶
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
