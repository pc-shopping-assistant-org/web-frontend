import type {Metadata} from "next";

import {AdminCustomerDetailPage} from "@/features/admin/detail-pages";

export const metadata: Metadata = {title: "Customer"};

export default async function AdminCustomerRoute({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminCustomerDetailPage customerId={id} />;
}
