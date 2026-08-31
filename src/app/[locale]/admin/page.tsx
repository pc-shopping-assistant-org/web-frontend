import type {Metadata} from "next";

import {AdminDashboardPage} from "@/features/admin/dashboard-page";

export const metadata: Metadata = {title: "Admin dashboard"};
export default function AdminRoute() { return <AdminDashboardPage />; }
