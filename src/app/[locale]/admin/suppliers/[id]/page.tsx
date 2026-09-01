import type {Metadata} from "next";

import {AdminSupplierDetailRouteClient} from "../../admin-route-client";

export const metadata: Metadata = {title: "Supplier"};

export default async function AdminSupplierRoute({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminSupplierDetailRouteClient supplierId={id} />;
}
