import type {Metadata} from "next";

import {AdminProductDetailRouteClient} from "../../admin-route-client";

export const metadata: Metadata = {title: "Product"};

export default async function AdminProductRoute({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminProductDetailRouteClient productId={id} />;
}
