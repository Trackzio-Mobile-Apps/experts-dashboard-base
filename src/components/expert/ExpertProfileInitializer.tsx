"use client";

import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import { useEffect, useRef } from "react";

/**
 * Fetches `GET /experts/me` on mount when a session token exists.
 * Mount inside `ExpertProfileProvider` (e.g. expert panel layout).
 */
export function ExpertProfileInitializer() {
  const { initialize, isInitialized } = useExpertProfile();
  const started = useRef(false);

  useEffect(() => {
    if (started.current || isInitialized) return;
    started.current = true;
    void initialize();
  }, [initialize, isInitialized]);

  return null;
}
