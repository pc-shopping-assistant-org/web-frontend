import type {Metadata} from "next";

import {AdminInvoiceDetailRouteClient} from "../../admin-route-client";

export const metadata: Metadata = {title: "Invoice"};

export default async function AdminInvoiceRoute({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminInvoiceDetailRouteClient orderId={id} />;
}
