import type {Metadata} from "next";

import {AssistantRouteClient} from "./assistant-route-client";

export const metadata: Metadata = {title: "AI assistant"};
export default function AssistantRoute() { return <AssistantRouteClient />; }
