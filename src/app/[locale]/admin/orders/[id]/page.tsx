import type {Metadata} from "next";

import {AdminOrderDetailRouteClient} from "../../admin-route-client";

export const metadata: Metadata = {title: "Order"};

export default async function AdminOrderRoute({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminOrderDetailRouteClient orderId={id} />;
}
