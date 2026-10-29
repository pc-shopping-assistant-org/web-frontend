"use client";

import dynamic from "next/dynamic";

import {AssistantPageSkeleton} from "@/components/ui/loading-skeletons";

const AssistantPage = dynamic(() => import("@/features/assistant/assistant-page").then((module) => module.AssistantPage), {
  loading: () => <AssistantPageSkeleton />,
});

export function AssistantRouteClient({
  initialConversationId,
  initialProductIds,
  initialPrompt,
  invalidBuild,
}: {
  initialConversationId?: string;
  initialProductIds?: string[];
  initialPrompt?: string;
  invalidBuild?: boolean;
}) {
  return (
    <AssistantPage key={initialConversationId ?? initialPrompt} initialConversationId={initialConversationId} initialProductIds={initialProductIds} initialPrompt={initialPrompt} invalidBuild={invalidBuild} />
  );
}
