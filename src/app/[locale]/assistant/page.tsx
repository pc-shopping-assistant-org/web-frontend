import type {Metadata} from "next";
import {z} from "zod";
import {buildQuestion} from "@/features/pc-builder/ask-ai";
import {selectionSchema} from "@/features/pc-builder/contracts";

import {AssistantRouteClient} from "./assistant-route-client";

export const metadata: Metadata = {title: "AI assistant"};
export default async function AssistantRoute({searchParams, params: routeParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>; params: Promise<{locale: string}>}) {
  const params = await searchParams;
  const {locale} = await routeParams;
  let initialPrompt = "";
  let invalidBuild = false;
  if (params.build) {
    try { initialPrompt = buildQuestion(selectionSchema.parse(JSON.parse(String(params.build))), locale); }
    catch { invalidBuild = true; }
  }
  const raw = params.productIds ?? params.productId;
  const parsed = z.array(z.uuid()).max(5).safeParse(raw ? [...new Set(String(raw).split(",").filter(Boolean))] : []);
  return <AssistantRouteClient initialProductIds={!params.build && parsed.success ? parsed.data : []} initialPrompt={initialPrompt} invalidBuild={invalidBuild} />;
}
