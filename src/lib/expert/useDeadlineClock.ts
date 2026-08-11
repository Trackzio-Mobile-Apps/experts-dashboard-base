"use client";

import { useEffect, useState } from "react";

/** Ticks on an interval so deadline labels update while list pages stay open. */
export function useDeadlineClock(intervalMs = 15_000): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return nowMs;
}
