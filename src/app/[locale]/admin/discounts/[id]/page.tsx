import type {Metadata} from "next";

import {AdminDiscountDetailRouteClient} from "../../admin-route-client";

export const metadata: Metadata = {title: "Discount"};

export default async function AdminDiscountRoute({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminDiscountDetailRouteClient discountId={id} />;
}
