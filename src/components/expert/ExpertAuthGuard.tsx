import { ExpertSessionSkeleton } from "@/components/expert/ExpertSkeleton";
import { hasExpertSession } from "@/lib/expert/apiClient";
import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import { useRouter } from "@/lib/router";
import { useEffect, useState, type ReactNode } from "react";

export function ExpertAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isInitialized, isLoading } = useExpertProfile();
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const authenticated = await hasExpertSession();
      if (!authenticated) {
        router.replace("/expert/login");
        setHasSession(false);
        return;
      }
      setHasSession(true);
    })();
  }, [router]);

  if (hasSession === null || !hasSession || !isInitialized || isLoading) {
    return <ExpertSessionSkeleton />;
  }

  return children;
}
