import type {Metadata} from "next";

import {AdminOrderDetailPage} from "@/features/admin/detail-pages";

export const metadata: Metadata = {title: "Order"};

export default async function AdminOrderRoute({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminOrderDetailPage orderId={id} />;
}
