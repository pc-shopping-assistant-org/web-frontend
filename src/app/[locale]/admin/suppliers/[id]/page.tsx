import type {Metadata} from "next";

import {AdminSupplierDetailPage} from "@/features/admin/detail-pages";

export const metadata: Metadata = {title: "Supplier"};

export default async function AdminSupplierRoute({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminSupplierDetailPage supplierId={id} />;
}
