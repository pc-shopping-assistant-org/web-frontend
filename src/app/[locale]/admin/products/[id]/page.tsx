import type {Metadata} from "next";

import {AdminProductDetailPage} from "@/features/admin/detail-pages";

export const metadata: Metadata = {title: "Product"};

export default async function AdminProductRoute({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AdminProductDetailPage productId={id} />;
}
