import { ExpertSessionSkeleton } from "@/components/expert/ExpertSkeleton";
import { hasExpertSession } from "@/lib/expert/apiClient";
import { useRouter } from "@/lib/router";
import { useEffect, useState, type ReactNode } from "react";

export function ExpertLoginGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      if (await hasExpertSession()) {
        router.replace("/expert/queue");
        return;
      }
      setReady(true);
    })();
  }, [router]);

  if (!ready) return <ExpertSessionSkeleton />;

  return children;
}
