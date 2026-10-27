"use client";

import {IconArrowRight} from "@tabler/icons-react";
import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";

import {Link} from "@/i18n/navigation";
import {cn} from "@/lib/utils";
import {FeaturedProductsSkeleton} from "@/components/ui/loading-skeletons";
import type {CategoryTree, ProductSummary} from "@/features/catalog/contracts/responses";
import {ProductCard} from "./product-card";

/**
 * Most products shown at once: two rows of six on a wide screen. A multiple of 2, 3, 4 and 6, the column counts of the
 * grid, so the last row is never short. The rest is one tap away in the category.
 */
const VISIBLE_PRODUCTS = 12;
/** Most category chips; the catalog's navigation order applies here too. */
const VISIBLE_CHIPS = 8;
const ALL = "all";

export function FeaturedProducts({
  products,
  categories = [],
  pending = false,
  unavailable = false,
}: {
  products: ProductSummary[];
  categories?: CategoryTree[];
  pending?: boolean;
  unavailable?: boolean;
}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const [selected, setSelected] = useState(ALL);
  if (pending) return <FeaturedProductsSkeleton />;
  if (unavailable)
    return <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t("catalogDescription")}</div>;
  if (products.length === 0)
    return <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">{t("noProducts")}</div>;

  const groups = groupProducts(products, categories, t("uncategorized"), locale);
  const chips = groups.slice(0, VISIBLE_CHIPS);
  const group = chips.find((chip) => chip.id === selected);
  const shown = group ? group.products : products;
  const more = shown.length - VISIBLE_PRODUCTS;

  return (
    <div className="space-y-5 [content-visibility:auto] [contain-intrinsic-size:1200px]">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" role="group" aria-label={t("categoryTitle")}>
        <FilterChip active={!group} onClick={() => setSelected(ALL)} label={t("filterAll")} />
        {chips.map((chip) => (
          <FilterChip key={chip.id} active={chip.id === group?.id} onClick={() => setSelected(chip.id)} label={chip.name} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
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
function FilterChip({active, onClick, label}: {active: boolean; onClick: () => void; label: string}) {
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
      <span className="max-w-40 truncate" title={label}>
        {label}
      </span>
    </button>
  );
}

type ProductGroup = {id: string; name: string; products: ProductSummary[]};

function groupProducts(products: ProductSummary[], categories: CategoryTree[], uncategorized: string, locale: string): ProductGroup[] {
  const order = new Map<string, number>();
  const visit = (nodes: CategoryTree[]) => nodes.forEach((node) => {
    order.set(node.id, order.size);
    visit(node.children);
  });
  visit(categories);
  const groups = new Map<string, ProductGroup>();
  for (const product of products) {
    const id = product.categoryId ?? "uncategorized";
    const current = groups.get(id) ?? {id, name: product.categoryName ?? uncategorized, products: []};
    current.products.push(product);
    groups.set(id, current);
  }
  return [...groups.values()].sort(
    (left, right) => (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.id) ?? Number.MAX_SAFE_INTEGER)
      || left.name.localeCompare(right.name, locale),
  );
}
