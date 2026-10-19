import type {Metadata} from "next";

import {EmployeeCreateRouteClient} from "../../admin-route-client";

export const metadata: Metadata = {title: "New employee"};

export default function AdminEmployeeCreateRoute() {
  return <EmployeeCreateRouteClient />;
}
