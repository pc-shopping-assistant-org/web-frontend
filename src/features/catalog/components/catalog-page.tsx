"use client";

import {ChevronLeft, ChevronRight, SlidersHorizontal, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {useMemo, useState, useSyncExternalStore} from "react";

import {Button} from "@/components/ui/button";
import {useCursorTrail} from "@/lib/hooks/use-cursor-trail";
import {ProductGridSkeleton} from "@/components/ui/loading-skeletons";
import {useRouter} from "@/i18n/navigation";
import {Link} from "@/i18n/navigation";
import {ApiClientError} from "@/lib/api/envelope";
import {cn} from "@/lib/utils";
import {ApiMessageKey} from "@/lib/domain/message-keys";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

import {useBrands, useCategories, useProducts} from "../queries";
import {CatalogFilters, categoryOptions} from "./catalog-filters";
import {ProductGrid} from "./product-grid";

// Never changes after mount, so the store never needs to notify.
const subscribeNoop = () => () => {};

const PAGE_SIZE = 15;

type CatalogPageProps = {
  initialKeyword?: string;
  initialCategoryId?: string;
  initialBrandId?: string;
  initialMinPrice?: number;
  initialMaxPrice?: number;
};

export function CatalogPage({
  initialKeyword = "",
  initialCategoryId,
  initialBrandId,
  initialMinPrice,
  initialMaxPrice,
}: CatalogPageProps = {}) {
  const t = useTranslations("catalog");
  const common = useTranslations("common");
  const router = useRouter();
  const [filters, setFilters] = useState({
    limit: PAGE_SIZE,
    cursor: undefined as string | undefined,
    keyword: initialKeyword || undefined,
    categoryId: initialCategoryId || undefined,
    brandId: initialBrandId || undefined,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const query = useProducts(filters);
  const categories = useCategories();
  const brands = useBrands();
  const products = query.data?.items ?? [];
  // `SiteHeader` shares the `catalog/categories` query key, and this page is
  // lazy loaded, so its chunk can hydrate after the header has already resolved
  // that query: the server prerenders the loading state while the client
  // renders the loaded lists, which fails hydration. Holding the loading state
  // until after mount keeps the first client pass identical to the server pass.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const categoryList = useMemo(() => categoryOptions(categories.data ?? []), [categories.data]);
  const brandList = useMemo(
    () =>
      (brands.data ?? []).filter((brand) => brand.status === ResourceStatus.Active).map((brand) => ({value: brand.id, label: brand.name})),
    [brands.data],
  );

  /** Every change of what is shown goes back to the first page and into the URL. */
  function update(patch: Partial<CatalogUrlFilters>) {
    const next = {...filters, ...patch, cursor: undefined};
    setFilters(next);
    setCompareIds([]);
    syncCatalogUrl(router, next);
  }

  function clearFilters() {
    update({keyword: undefined, categoryId: undefined, brandId: undefined, minPrice: undefined, maxPrice: undefined});
  }

  const trail = useCursorTrail(JSON.stringify({...filters, cursor: undefined}));
  function movePage(cursor?: string) {
    const next = {...filters, cursor};
    setFilters(next);
    syncCatalogUrl(router, next);
  }

  const selectedCategoryName = categoryList.find((category) => category.value === filters.categoryId)?.label;
  const selectedBrandName = brandList.find((brand) => brand.value === filters.brandId)?.label;
  const activeFilters: {key: keyof CatalogUrlFilters; label: string}[] = [
    ...(filters.categoryId ? [{key: "categoryId" as const, label: `${t("category")}: ${selectedCategoryName ?? filters.categoryId}`}] : []),
    ...(filters.brandId ? [{key: "brandId" as const, label: `${t("brand")}: ${selectedBrandName ?? filters.brandId}`}] : []),
    ...(filters.minPrice !== undefined
      ? [{key: "minPrice" as const, label: `${t("minPrice")}: ${formatFilterValue(filters.minPrice)}`}]
      : []),
    ...(filters.maxPrice !== undefined
      ? [{key: "maxPrice" as const, label: `${t("maxPrice")}: ${formatFilterValue(filters.maxPrice)}`}]
      : []),
  ];
  const narrowedBy = activeFilters.length;
  const anyFilter = narrowedBy > 0 || Boolean(filters.keyword);

  return (
    <section className="page-wrap py-6 sm:py-8">
      <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[15rem_minmax(0,1fr)]">
        <aside
          className={cn(
            "mb-5 rounded-xl border bg-card p-4 lg:mb-0 lg:block lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0",
            filtersOpen ? "block" : "hidden",
          )}
        >
          <CatalogFilters
            categories={categoryList}
            brands={brandList}
            loading={!hydrated || categories.isPending || brands.isPending}
            categoryId={filters.categoryId}
            brandId={filters.brandId}
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            onCategory={(categoryId) => update({categoryId})}
            onBrand={(brandId) => update({brandId})}
            onPrice={({minPrice, maxPrice}) => update({minPrice, maxPrice})}
            onClear={anyFilter ? clearFilters : undefined}
          />
        </aside>

        <div className="min-w-0">
          <h1 className="text-lg font-medium sm:text-xl">
            {filters.keyword
              ? t.rich("searchResultsFor", {
                  keyword: filters.keyword,
                  mark: (chunks) => <span className="break-words text-primary">{chunks}</span>,
                })
              : t("allProducts")}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-muted/50 px-3 py-2.5 sm:px-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="lg:hidden"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {t("filterTitleShort")}
              {narrowedBy > 0 ? (
                <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[0.7rem] font-semibold text-primary-foreground">
                  {narrowedBy}
                </span>
              ) : null}
            </Button>
            {query.data ? (
              <p className="text-sm text-muted-foreground">{t("resultCount", {count: query.data.size ?? products.length})}</p>
            ) : null}
            {filters.keyword || activeFilters.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2" aria-label={t("filteredResults")}>
                {filters.keyword ? (
                  <FilterChip
                    label={`${t("search")}: ${filters.keyword}`}
                    onRemove={() => update({keyword: undefined})}
                    removeLabel={t("removeFilter")}
                  />
                ) : null}
                {activeFilters.map(({key, label}) => (
                  <FilterChip key={key} label={label} onRemove={() => update({[key]: undefined})} removeLabel={t("removeFilter")} />
                ))}
              </div>
            ) : null}
            {trail.hasPrev || query.data?.hasNext ? (
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t("previous")}
                  title={t("previous")}
                  disabled={!trail.hasPrev}
                  onClick={() => {
                    trail.pop();
                    movePage(trail.prevCursor);
                  }}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t("next")}
                  title={t("next")}
                  disabled={!query.data?.hasNext || !query.data?.nextCursor}
                  onClick={() => {
                    trail.push(filters.cursor);
                    movePage(query.data?.nextCursor);
                  }}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            {query.isPending ? <CatalogLoading /> : null}
            {query.isError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                <p className="font-medium">{t("loadError")}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {query.error instanceof ApiClientError && query.error.messageKey === ApiMessageKey.SERVICE_UNAVAILABLE
                    ? common("backendUnavailable")
                    : common("unknownError")}
                </p>
                <Button className="mt-5" variant="outline" onClick={() => void query.refetch()}>
                  {common("retry")}
                </Button>
              </div>
            ) : null}
            {!query.isPending && !query.isError ? (
              <div className={cn("transition-opacity duration-200", query.isFetching && "opacity-60")} aria-busy={query.isFetching}>
                <ProductGrid
                  variant="listing"
                  products={products}
                  compareIds={compareIds}
                  onClearFilters={anyFilter ? clearFilters : undefined}
                  onCompareToggle={(product) => {
                    if (!product.id) return;
                    setCompareIds((current) =>
                      current.includes(product.id!)
                        ? current.filter((id) => id !== product.id)
                        : current.length < 5
                          ? [...current, product.id!]
                          : current,
                    );
                  }}
                />
                <CompareTray products={products} ids={compareIds} onClear={() => setCompareIds([])} />
                {trail.hasPrev || query.data?.hasNext ? (
                  <div className="mt-8 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={!trail.hasPrev}
                      onClick={() => {
                        trail.pop();
                        movePage(trail.prevCursor);
                      }}
                    >
                      <ChevronLeft className="size-4" />
                      {t("previous")}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!query.data?.hasNext || !query.data?.nextCursor}
                      onClick={() => {
                        trail.push(filters.cursor);
                        movePage(query.data?.nextCursor);
                      }}
                    >
                      {t("next")}
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterChip({label, removeLabel, onRemove}: {label: string; removeLabel: string; onRemove: () => void}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={`${removeLabel}: ${label}`}
      onClick={onRemove}
      className="inline-flex h-8 max-w-60 items-center gap-1 rounded-full border bg-background pl-3 pr-2 text-sm transition hover:border-primary/40 hover:bg-primary/5"
    >
      <span className="truncate">{label}</span>
      <X className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}

function CompareTray({
  products,
  ids,
  onClear,
}: {
  products: import("@/features/catalog/contracts/responses").ProductSummary[];
  ids: string[];
  onClear: () => void;
}) {
  const t = useTranslations("catalog");
  const selected = useMemo(() => ids.map((id) => products.find((product) => product.id === id)).filter(Boolean), [ids, products]);
  if (ids.length === 0) return null;

  const compareHref = `/assistant?productIds=${encodeURIComponent(ids.join(","))}`;
  return (
    <div
      className="sticky bottom-4 z-20 mt-7 rounded-2xl border border-primary/20 bg-background/95 p-3 shadow-xl shadow-slate-950/10 backdrop-blur sm:p-4"
      role="region"
      aria-label={t("compareTray")}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <SlidersHorizontal className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{t("compareTrayTitle", {count: ids.length})}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {selected
                .map((product) => product?.name)
                .filter(Boolean)
                .join(" · ") || t("compareTrayHint")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            <X className="size-4" />
            {t("clearCompare")}
          </Button>
          <Link
            href={ids.length >= 2 ? compareHref : "/assistant"}
            aria-disabled={ids.length < 2}
            tabIndex={ids.length < 2 ? -1 : undefined}
            className={`inline-flex h-7 items-center justify-center gap-1 rounded-lg px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all ${ids.length >= 2 ? "bg-primary text-primary-foreground hover:bg-primary/80" : "pointer-events-none bg-muted text-muted-foreground"}`}
          >
            {t("compareNow")}
          </Link>
        </div>
      </div>
    </div>
  );
}

type CatalogUrlFilters = {
  keyword?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
};

function syncCatalogUrl(router: ReturnType<typeof useRouter>, filters: CatalogUrlFilters) {
  const params = new URLSearchParams();
  // Paging state (limit, cursor) is not part of the shareable URL
  for (const key of ["keyword", "categoryId", "brandId", "minPrice", "maxPrice"] as const) {
    const value = filters[key];
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  router.replace(query ? `/products?${query}` : "/products");
}

function formatFilterValue(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function CatalogLoading() {
  return <ProductGridSkeleton count={8} />;
}
