import type {Metadata} from "next";

import {AdminDashboardRouteClient} from "../admin-route-client";

export const metadata: Metadata = {title: "Statistics"};

/**
 * The statistics use case uses the same backend read models as the dashboard,
 * but has its own stable route so operators can bookmark and share reports.
 */
export default function AdminStatisticsRoute() {
  return <AdminDashboardRouteClient mode="statistics" />;
}
