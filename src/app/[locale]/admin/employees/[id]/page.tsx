import type {Metadata} from "next";

import {AdminEmployeeDetailRouteClient} from "../../admin-route-client";

export const metadata: Metadata = {title: "Employee"};

export default async function AdminEmployeeRoute({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminEmployeeDetailRouteClient employeeId={id} />;
}
