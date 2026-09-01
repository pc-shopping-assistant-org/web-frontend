import type {Metadata} from "next";

import {AdminDashboardRouteClient} from "./admin-route-client";

export const metadata: Metadata = {title: "Admin dashboard"};
export default function AdminRoute() { return <AdminDashboardRouteClient />; }
