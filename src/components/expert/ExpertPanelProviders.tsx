import { ExpertAvailabilityPromptGate } from "@/components/expert/ExpertAvailabilityPromptGate";
import { ExpertDeadlineExceededToastGate } from "@/components/expert/ExpertDeadlineExceededToastGate";
import { ExpertEvaluationDueSoonGate } from "@/components/expert/ExpertEvaluationDueSoonGate";
import { ExpertInboxToastGate } from "@/components/expert/ExpertInboxToastGate";
import { ExpertNewRequestToastGate } from "@/components/expert/ExpertNewRequestToastGate";
import { ExpertSubmitSuccessToastGate } from "@/components/expert/ExpertSubmitSuccessToastGate";
import { ExpertProfileInitializer } from "@/components/expert/ExpertProfileInitializer";
import { ExpertInboxProvider } from "@/lib/expert/expertInboxStore";
import { ExpertPanelDataProvider } from "@/lib/expert/expertPanelDataStore";
import { ExpertProfileProvider } from "@/lib/expert/expertProfileStore";
import { ExpertSocketProvider } from "@/lib/expert/expertSocketProvider";
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
            <ExpertNewRequestToastGate />
            <ExpertSubmitSuccessToastGate />
            <ExpertDeadlineExceededToastGate />
            <ExpertInboxToastGate />
            {children}
          </ExpertInboxProvider>
        </ExpertSocketProvider>
      </ExpertPanelDataProvider>
    </ExpertProfileProvider>
  );
}
