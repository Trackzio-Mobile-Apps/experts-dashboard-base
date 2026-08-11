import { ExpertQueueRequestPageClient } from "@/components/expert/ExpertQueueRequestPageClient";
import { ExpertRequestDetailSkeleton } from "@/components/expert/ExpertSkeleton";
import { useParams } from "@/lib/router";
import { useEffect } from "react";

export default function ExpertQueueRequestPage() {
  const { reqId = "" } = useParams<{ reqId: string }>();

  useEffect(() => {
    if (!reqId) return;
    document.title = `Request ${reqId.slice(-8).toUpperCase()} | Coinzy Expert Portal`;
  }, [reqId]);

  if (!reqId) {
    return <ExpertRequestDetailSkeleton />;
  }

  return <ExpertQueueRequestPageClient requestId={reqId} />;
}
