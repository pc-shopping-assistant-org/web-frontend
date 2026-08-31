import type {Metadata} from "next";

import {AssistantPage} from "@/features/assistant/assistant-page";

export const metadata: Metadata = {title: "AI assistant"};
export default function AssistantRoute() { return <AssistantPage />; }
