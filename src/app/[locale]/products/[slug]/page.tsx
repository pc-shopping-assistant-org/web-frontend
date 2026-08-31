import type {Metadata} from "next";

import {ProductDetailPage} from "@/features/catalog/components/product-detail-page";

type Props = {params: Promise<{slug: string}>};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params;
  return {title: slug.replaceAll("-", " ")};
}

export default async function ProductPage({params}: Props) {
  const {slug} = await params;
  return <ProductDetailPage slug={slug} />;
}
