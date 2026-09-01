"use client";

import dynamic from "next/dynamic";
import type {ComponentProps} from "react";

import {
  CatalogPageSkeleton,
  ProductDetailPageSkeleton,
} from "@/components/ui/loading-skeletons";

const CatalogPage = dynamic(
  () => import("@/features/catalog/components/catalog-page").then((module) => module.CatalogPage),
  {loading: () => <CatalogPageSkeleton />},
);

const ProductDetailPage = dynamic(
  () => import("@/features/catalog/components/product-detail-page").then((module) => module.ProductDetailPage),
  {loading: () => <ProductDetailPageSkeleton />},
);

export function CatalogRouteClient(
  props: ComponentProps<typeof CatalogPage>,
) {
  return <CatalogPage {...props} />;
}

export function ProductDetailRouteClient({slug}: {slug: string}) {
  return <ProductDetailPage slug={slug} />;
}
