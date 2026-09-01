"use client";

import {IconArrowRight} from "@tabler/icons-react";
import {useLocale, useTranslations} from "next-intl";

import {Link} from "@/i18n/navigation";
import {FeaturedProductsSkeleton} from "@/components/ui/loading-skeletons";
import type {ProductSummary} from "@/features/catalog/contracts/responses";
import {CatalogCategoryIcon} from "./catalog-category-icon";
import {ProductCard} from "./product-card";

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
  if (pending) return <FeaturedProductsSkeleton />;
  if (unavailable) return <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t("catalogDescription")}</div>;
  const groups = groupProducts(products, t("uncategorized"), locale);
  if (products.length === 0) return <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">{t("noProducts")}</div>;

  return (
    <div className="space-y-8 [content-visibility:auto] [contain-intrinsic-size:1200px]">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="shrink-0">
          <p className="eyebrow whitespace-nowrap">{t("categoryEyebrow")}</p>
          <p className="mt-1 whitespace-nowrap text-sm font-medium">{t("categoryProductCount", {count: products.length})}</p>
        </div>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 [scrollbar-width:thin]" aria-label={t("categoryTitle")}>
          {groups.slice(0, 8).map((group) => (
            <Link
              key={group.id}
              href={group.id === "uncategorized" ? "/products" : `/products?categoryId=${encodeURIComponent(group.id)}`}
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-medium transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CatalogCategoryIcon categoryName={group.name} className="size-3.5" strokeWidth={1.8} />
              </span>
              <span className="max-w-32 truncate" title={group.name}>{group.name}</span>
              <span className="tabular-nums text-muted-foreground group-hover:text-primary/70">{group.products.length}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <CategoryShelf key={group.id} group={group} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.03] px-4 py-3">
        <p className="text-sm text-muted-foreground">{t("featuredDescription")}</p>
        <Link href="/products" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          {t("browseAllProducts")}
          <IconArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function CategoryShelf({group}: {group: ProductGroup}) {
  const t = useTranslations("home");
  const categoryHref = group.id === "uncategorized"
    ? "/products"
    : `/products?categoryId=${encodeURIComponent(group.id)}`;
  const shelfId = `category-shelf-${group.id}`;

  return (
    <section
      className="rounded-3xl border border-border/70 bg-card/35 p-4 shadow-sm sm:p-5"
      aria-labelledby={shelfId}
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CatalogCategoryIcon categoryName={group.name} className="size-5" strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <p className="eyebrow">{t("categoryRailEyebrow")}</p>
            <h3 id={shelfId} className="mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {group.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("categoryProductCount", {count: group.products.length})}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href={`/assistant?mode=CONSULT`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
          >
            {t("categoryRailAi")}
            <IconArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href={categoryHref}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm font-semibold transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            {t("viewCategory")}
            <IconArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {group.products.slice(0, 4).map((product, index) => (
          <ProductCard key={product.id ?? product.seoName ?? index} product={product} compact />
        ))}
      </div>
    </section>
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
