import { ExpertAuthGuard } from "@/components/expert/ExpertAuthGuard";
import { ExpertPanelChrome } from "@/components/expert/ExpertPanelChrome";
import { ExpertPanelProviders } from "@/components/expert/ExpertPanelProviders";
import { Outlet } from "@/lib/router";

export default function ExpertPanelLayout() {
  return (
    <ExpertPanelProviders>
      <ExpertAuthGuard>
        <ExpertPanelChrome>
          <Outlet />
        </ExpertPanelChrome>
      </ExpertAuthGuard>
    </ExpertPanelProviders>
  );
}
