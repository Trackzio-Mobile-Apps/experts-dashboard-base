import { ExpertDashboardHeader } from "@/components/expert/ExpertDashboardHeader";
import { formatAvgTurnaround, getExpertGreeting } from "@/lib/expert/format";
import { useExpertPanelData } from "@/lib/expert/expertPanelDataStore";
import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import type { ReactNode } from "react";

type ExpertDashboardSectionProps = {
  children: ReactNode;
};

/**
 * Top cards read the same canonical live lists as sidebar badges:
 * - Active cases → draftsList (Drafts badge)
 * - New requests → newRequestsList
 * Completed stays a profile all-time stat (not live panel state).
 */
export function ExpertDashboardSection({
  children,
}: ExpertDashboardSectionProps) {
  const { profile } = useExpertProfile();
  const {
    draftsList,
    newRequestsList,
    isLoading: panelLoading,
  } = useExpertPanelData();

  if (!profile) return null;

  const greeting = getExpertGreeting(profile.firstName);

  return (
    <>
      <ExpertDashboardHeader
        greeting={greeting}
        stats={{
          activeCases: draftsList.length,
          newRequests: newRequestsList.length,
          completed: profile.stats.completed,
          avgTurnaround: formatAvgTurnaround(profile.stats.avgCompletionHours),
        }}
        isLoading={panelLoading}
      />
      <div>{children}</div>
    </>
  );
}
