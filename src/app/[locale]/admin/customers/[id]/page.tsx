import type {Metadata} from "next";

import {AdminCustomerDetailRouteClient} from "../../admin-route-client";

export const metadata: Metadata = {title: "Customer"};

export default async function AdminCustomerRoute({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminCustomerDetailRouteClient customerId={id} />;
}
