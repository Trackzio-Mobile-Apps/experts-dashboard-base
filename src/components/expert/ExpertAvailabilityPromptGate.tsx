"use client";

import { ExpertAvailabilityPromptModal } from "@/components/expert/ExpertAvailabilityPromptModal";
import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import {
  ExpertProfileError,
  updateMyAvailability,
} from "@/lib/expert/profileService";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * When the expert panel loads/refreshes while unavailable, prompt them to turn
 * availability back on. Does not re-open mid-session after they just went
 * unavailable (only on a fresh mount / window refresh).
 */
export function ExpertAvailabilityPromptGate() {
  const { profile, hydrateProfile } = useExpertProfile();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const initialPromptHandledRef = useRef(false);

  useEffect(() => {
    if (!profile || initialPromptHandledRef.current) return;

    initialPromptHandledRef.current = true;
    if (!profile.isAvailableForRequests) {
      setOpen(true);
    }
  }, [profile]);

  const handleStayUnavailable = useCallback(() => {
    setOpen(false);
  }, []);

  const handleMakeAvailable = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const updated = await updateMyAvailability(true);
      hydrateProfile(updated);
      setOpen(false);
    } catch (err) {
      if (err instanceof ExpertProfileError && err.code === "unauthorized") {
        return;
      }
      window.alert(
        err instanceof Error
          ? err.message
          : "Unable to update availability. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [hydrateProfile, isSaving]);

  return (
    <ExpertAvailabilityPromptModal
      open={open}
      isSaving={isSaving}
      onStayUnavailable={handleStayUnavailable}
      onMakeAvailable={() => void handleMakeAvailable()}
    />
  );
}
