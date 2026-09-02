import { ExpertAvailabilityPromptGate } from "@/components/expert/ExpertAvailabilityPromptGate";
import { ExpertDeadlineExceededToastGate } from "@/components/expert/ExpertDeadlineExceededToastGate";
import { ExpertEvaluationDueSoonGate } from "@/components/expert/ExpertEvaluationDueSoonGate";
import { ExpertProfileInitializer } from "@/components/expert/ExpertProfileInitializer";
import { ExpertInboxToastGate } from "@/components/expert/ExpertInboxToastGate";
import { ExpertPanelDataProvider } from "@/lib/expert/expertPanelDataStore";
import { ExpertInboxProvider } from "@/lib/expert/expertInboxStore";
import { ExpertSocketProvider } from "@/lib/expert/expertSocketProvider";
import { ExpertProfileProvider } from "@/lib/expert/expertProfileStore";
import type { ReactNode } from "react";

export function ExpertPanelProviders({ children }: { children: ReactNode }) {
  return (
    <ExpertProfileProvider>
      <ExpertPanelDataProvider>
        <ExpertSocketProvider>
          <ExpertInboxProvider>
            <ExpertProfileInitializer />
            <ExpertAvailabilityPromptGate />
            <ExpertEvaluationDueSoonGate />
            <ExpertDeadlineExceededToastGate />
            <ExpertInboxToastGate />
            {children}
          </ExpertInboxProvider>
        </ExpertSocketProvider>
      </ExpertPanelDataProvider>
    </ExpertProfileProvider>
  );
}
