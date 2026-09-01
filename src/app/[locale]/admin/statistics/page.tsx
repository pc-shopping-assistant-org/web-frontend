import type {Metadata} from "next";

import {AdminDashboardPage} from "@/features/admin/dashboard-page";

export const metadata: Metadata = {title: "Statistics"};

/**
 * The statistics use case uses the same backend read models as the dashboard,
 * but has its own stable route so operators can bookmark and share reports.
 */
export default function AdminStatisticsRoute() {
  return <AdminDashboardPage mode="statistics" />;
}
