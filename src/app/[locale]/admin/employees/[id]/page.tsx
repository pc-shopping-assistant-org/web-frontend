import type {Metadata} from "next";

import {AdminEmployeeDetailPage} from "@/features/admin/detail-pages";

export const metadata: Metadata = {title: "Employee"};

export default async function AdminEmployeeRoute({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminEmployeeDetailPage employeeId={id} />;
}
