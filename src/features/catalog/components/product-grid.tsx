import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import type {ProductSummary} from "@/features/catalog/contracts/responses";

import {ProductCard} from "./product-card";

export function ProductGrid({
  products,
  compareIds = [],
  onCompareToggle,
  onClearFilters,
  variant = "default",
}: {
  products: ProductSummary[];
  compareIds?: string[];
  onCompareToggle?: (product: ProductSummary) => void;
  onClearFilters?: () => void;
  /** `listing` is the denser grid and lean card of the product list page. */
  variant?: "default" | "listing";
}) {
  const t = useTranslations("catalog");
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/15 p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
        {onClearFilters ? (
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onClearFilters}>
            {t("clearFilters")}
          </Button>
        ) : null}
      </div>
    );
  }
  return (
    <div className={variant === "listing" ? "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"}>
      {products.map((product, index) => <ProductCard
        key={product.id ?? product.seoName ?? index}
        product={product}
        variant={variant}
        compareSelected={Boolean(product.id && compareIds.includes(product.id))}
        compareDisabled={compareIds.length >= 5}
        onCompareToggle={onCompareToggle}
      />)}
    </div>
  );
}
