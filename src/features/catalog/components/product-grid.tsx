import {useTranslations} from "next-intl";

import type {ProductSummary} from "@/lib/api/types";

import {ProductCard} from "./product-card";

export function ProductGrid({products}: {products: ProductSummary[]}) {
  const t = useTranslations("catalog");
  if (products.length === 0) {
    return <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">{t("empty")}</div>;
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => <ProductCard key={product.id ?? product.seoName ?? index} product={product} />)}
    </div>
  );
}
