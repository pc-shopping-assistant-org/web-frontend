"use client";

import {useTranslations} from "next-intl";

import {useProducts} from "../queries";
import {ProductGrid} from "./product-grid";

export function FeaturedProducts() {
  const t = useTranslations("home");
  const query = useProducts({limit: 6});
  if (query.isPending) return <div className="h-80 animate-pulse rounded-2xl bg-muted" />;
  if (query.isError) return <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t("catalogDescription")}</div>;
  return <ProductGrid products={query.data?.items ?? []} />;
}
