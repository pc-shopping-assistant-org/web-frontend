import type {Metadata} from "next";

import {AdminDashboardRouteClient} from "../admin-route-client";

export const metadata: Metadata = {title: "Statistics"};

/** The sales report has its own route, so it can be bookmarked and shared. */
export default function AdminStatisticsRoute() {
  return <AdminDashboardRouteClient mode="statistics" />;
}
