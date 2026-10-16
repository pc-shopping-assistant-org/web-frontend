import type {Metadata} from "next";

import {SearchIndexRouteClient} from "../admin-route-client";

export const metadata: Metadata = {title: "Search index"};

export default function AdminSearchIndexRoute() {
  return <SearchIndexRouteClient />;
}
