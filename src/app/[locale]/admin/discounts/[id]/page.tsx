import type {Metadata} from "next";

import {AdminDiscountDetailPage} from "@/features/admin/detail-pages";

export const metadata: Metadata = {title: "Discount"};

export default async function AdminDiscountRoute({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminDiscountDetailPage discountId={id} />;
}
