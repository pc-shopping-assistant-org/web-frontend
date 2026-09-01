"use client";

import dynamic from "next/dynamic";

import {AssistantPageSkeleton} from "@/components/ui/loading-skeletons";

const AssistantPage = dynamic(
  () => import("@/features/assistant/assistant-page").then((module) => module.AssistantPage),
  {loading: () => <AssistantPageSkeleton />},
);

export function AssistantRouteClient() {
  return <AssistantPage />;
}
