"use client";

import {IconArrowRight} from "@tabler/icons-react";
import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";

import {Link} from "@/i18n/navigation";
import {cn} from "@/lib/utils";
import {FeaturedProductsSkeleton} from "@/components/ui/loading-skeletons";
import type {ProductSummary} from "@/features/catalog/contracts/responses";
import {ProductCard} from "./product-card";

/** Most products shown at once: two rows of four on a wide screen. The rest is one tap away in the category. */
const VISIBLE_PRODUCTS = 8;
/** Most category chips; the categories with the most products come first. */
const VISIBLE_CHIPS = 8;
const ALL = "all";

export function FeaturedProducts({
  products,
  pending = false,
  unavailable = false,
}: {
  products: ProductSummary[];
  pending?: boolean;
  unavailable?: boolean;
}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const [selected, setSelected] = useState(ALL);
  if (pending) return <FeaturedProductsSkeleton />;
  if (unavailable) return <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t("catalogDescription")}</div>;
  if (products.length === 0) return <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">{t("noProducts")}</div>;

  const groups = groupProducts(products, t("uncategorized"), locale);
  const chips = groups.slice(0, VISIBLE_CHIPS);
  const group = chips.find((chip) => chip.id === selected);
  const shown = group ? group.products : products;
  const more = shown.length - VISIBLE_PRODUCTS;

  return (
    <div className="space-y-5 [content-visibility:auto] [contain-intrinsic-size:1200px]">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" role="group" aria-label={t("categoryTitle")}>
        <FilterChip active={!group} onClick={() => setSelected(ALL)} label={t("filterAll")} count={products.length} />
        {chips.map((chip) => (
          <FilterChip key={chip.id} active={chip.id === group?.id} onClick={() => setSelected(chip.id)} label={chip.name} count={chip.products.length} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {shown.slice(0, VISIBLE_PRODUCTS).map((product, index) => (
          <ProductCard key={product.id ?? product.seoName ?? index} product={product} compact />
        ))}
      </div>

      {group && group.id !== "uncategorized" && more > 0 ? (
        <div className="flex justify-center">
          <Link
            href={`/products?categoryId=${encodeURIComponent(group.id)}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background px-4 py-2 text-sm font-semibold transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            {t("viewMoreInCategory", {name: group.name, count: more})}
            <IconArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** A filter, not a link: it narrows the grid below in place, so choosing a category costs no page load. */
function FilterChip({active, onClick, label, count}: {active: boolean; onClick: () => void; label: string; count: number}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border/70 bg-background hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
      )}
    >
      <span className="max-w-40 truncate" title={label}>{label}</span>
      <span className={cn("text-xs tabular-nums", active ? "text-primary-foreground/80" : "text-muted-foreground")}>{count}</span>
    </button>
  );
}

type ProductGroup = {id: string; name: string; products: ProductSummary[]};

function groupProducts(products: ProductSummary[], uncategorized: string, locale: string): ProductGroup[] {
  const groups = new Map<string, ProductGroup>();
  for (const product of products) {
    const id = product.categoryId ?? "uncategorized";
    const current = groups.get(id) ?? {id, name: product.categoryName ?? uncategorized, products: []};
    current.products.push(product);
    groups.set(id, current);
  }
  return [...groups.values()].sort((left, right) => right.products.length - left.products.length || left.name.localeCompare(right.name, locale));
}
