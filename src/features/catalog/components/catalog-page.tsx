"use client";

import {ChevronLeft, ChevronRight, Search, SlidersHorizontal, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {useMemo, useState} from "react";

import {Button} from "@/components/ui/button";
import {ProductGridSkeleton} from "@/components/ui/loading-skeletons";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import {Skeleton} from "@/components/ui/skeleton";
import {useRouter} from "@/i18n/navigation";
import {Link} from "@/i18n/navigation";
import {ApiClientError} from "@/lib/api/envelope";
import {cn} from "@/lib/utils";
import {ApiMessageKey} from "@/lib/domain/message-keys";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

import {useBrands, useCategories, useProducts} from "../queries";
import {CatalogCategoryIcon} from "./catalog-category-icon";
import {ProductGrid} from "./product-grid";

type CatalogPageProps = {
  initialKeyword?: string;
  initialCategoryId?: string;
  initialBrandId?: string;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  initialSortBy?: string;
  initialSortDirection?: string;
};

export function CatalogPage({
  initialKeyword = "",
  initialCategoryId,
  initialBrandId,
  initialMinPrice,
  initialMaxPrice,
  initialSortBy,
  initialSortDirection,
}: CatalogPageProps = {}) {
  const t = useTranslations("catalog");
  const common = useTranslations("common");
  const router = useRouter();
  const initialFilters = {
    limit: 12,
    cursor: undefined as string | undefined,
    keyword: initialKeyword || undefined,
    categoryId: initialCategoryId || undefined,
    brandId: initialBrandId || undefined,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    sortBy: initialSortBy || "createdAt",
    sortDirection: initialSortDirection || "DESC",
  };
  const [term, setTerm] = useState(initialKeyword);
  const [filters, setFilters] = useState(initialFilters);
  const [draft, setDraft] = useState(initialFilters);
  const [filterError, setFilterError] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const query = useProducts(filters);
  const categories = useCategories();
  const brands = useBrands();
  const products = query.data?.items ?? [];

  function applyFilters() {
    const min = draft.minPrice;
    const max = draft.maxPrice;
    if (min !== undefined && max !== undefined && min > max) {
      setFilterError(true);
      return;
    }
    setFilterError(false);
    setCompareIds([]);
    const next = {...draft, keyword: term.trim() || undefined, cursor: undefined};
    setFilters(next);
    setDraft((current) => ({...current, keyword: next.keyword}));
    syncCatalogUrl(router, next);
  }

  function clearFilters() {
    const reset = {
      limit: 12,
      cursor: undefined,
      keyword: undefined,
      categoryId: undefined,
      brandId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: "createdAt",
      sortDirection: "DESC",
    };
    setDraft(reset);
    setFilters(reset);
    setTerm("");
    setFilterError(false);
    setCompareIds([]);
    syncCatalogUrl(router, reset);
  }

  function movePage(cursor?: string) {
    const next = {...filters, cursor};
    setFilters(next);
    syncCatalogUrl(router, next);
  }

  const selectedCategoryName = filters.categoryId
    ? flattenCategories(categories.data ?? []).find(
        (category) => category.id === filters.categoryId,
      )?.label
    : undefined;
  const selectedBrandName = filters.brandId
    ? brands.data?.find((brand) => brand.id === filters.brandId)?.name
    : undefined;
  const activeFilters: {key: keyof CatalogUrlFilters; label: string}[] = [
    ...(filters.keyword ? [{key: "keyword" as const, label: `${t("search")}: ${filters.keyword}`}] : []),
    ...(filters.categoryId ? [{key: "categoryId" as const, label: `${t("category")}: ${selectedCategoryName ?? filters.categoryId}`}] : []),
    ...(filters.brandId ? [{key: "brandId" as const, label: `${t("brand")}: ${selectedBrandName ?? filters.brandId}`}] : []),
    ...(filters.minPrice !== undefined ? [{key: "minPrice" as const, label: `${t("minPrice")}: ${formatFilterValue(filters.minPrice)}`}] : []),
    ...(filters.maxPrice !== undefined ? [{key: "maxPrice" as const, label: `${t("maxPrice")}: ${formatFilterValue(filters.maxPrice)}`}] : []),
  ];

  function removeFilter(key: keyof CatalogUrlFilters) {
    const next = {...filters, [key]: undefined, cursor: undefined};
    setFilters(next);
    setDraft((current) => ({...current, [key]: undefined, cursor: undefined}));
    if (key === "keyword") setTerm("");
    syncCatalogUrl(router, next);
  }

  return (
    <section className="page-wrap py-12 sm:py-16">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="eyebrow">{t("allProducts")}</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <form
          className="flex w-full max-w-lg gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const next = {...filters, keyword: term.trim() || undefined, cursor: undefined};
            setFilters(next);
            setDraft((current) => ({...current, keyword: next.keyword}));
            setCompareIds([]);
            syncCatalogUrl(router, next);
          }}
        >
          <Input value={term} onChange={(event) => setTerm(event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} />
          <Button type="submit"><Search className="size-4" />{t("search")}</Button>
        </form>
      </div>

      {categories.isPending ? (
        <Skeleton className="mb-8 h-12 rounded-2xl" />
      ) : categories.data?.length ? (
        <div className="mb-8 rounded-2xl border border-border/70 bg-muted/20 p-2.5" aria-label={t("browseByCategory")}>
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible">
            <span className="shrink-0 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("browseByCategory")}</span>
            <Link href="/products" className={cn("shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition", !filters.categoryId ? "bg-primary text-primary-foreground shadow-sm" : "bg-background hover:bg-primary/5 hover:text-primary")}>{t("allProducts")}</Link>
            {quickCategories(categories.data).map((category) => (
              <Link key={category.id} href={`/products?categoryId=${encodeURIComponent(category.id ?? "")}`} className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition", filters.categoryId === category.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-background hover:bg-primary/5 hover:text-primary")}>
                <span className="flex size-5 items-center justify-center"><CatalogCategoryIcon categoryName={category.name} className="size-4" strokeWidth={1.8} /></span>
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-8 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="size-4" />{t("filters")}</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2"><Label htmlFor="category">{t("category")}</Label><Select id="category" value={draft.categoryId ?? ""} onChange={(event) => setDraft((current) => ({...current, categoryId: event.target.value || undefined}))}><option value="">{t("allCategories")}</option>{flattenCategories(categories.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</Select></div>
          <div className="space-y-2"><Label htmlFor="brand">{t("brand")}</Label><Select id="brand" value={draft.brandId ?? ""} onChange={(event) => setDraft((current) => ({...current, brandId: event.target.value || undefined}))}><option value="">{t("allBrands")}</option>{(brands.data ?? []).filter((brand) => brand.status === ResourceStatus.Active).map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</Select></div>
          <div className="space-y-2"><Label htmlFor="min-price">{t("minPrice")}</Label><Input id="min-price" type="number" min="0" value={draft.minPrice ?? ""} onChange={(event) => setDraft((current) => ({...current, minPrice: event.target.value ? Number(event.target.value) : undefined}))} /></div>
          <div className="space-y-2"><Label htmlFor="max-price">{t("maxPrice")}</Label><Input id="max-price" type="number" min="0" value={draft.maxPrice ?? ""} onChange={(event) => setDraft((current) => ({...current, maxPrice: event.target.value ? Number(event.target.value) : undefined}))} /></div>
          <div className="space-y-2"><Label htmlFor="sort">{t("sort")}</Label><Select id="sort" value={`${draft.sortBy}:${draft.sortDirection}`} onChange={(event) => {const [sortBy, sortDirection] = event.target.value.split(":"); setDraft((current) => ({...current, sortBy, sortDirection}));}}><option value="createdAt:DESC">{t("newest")}</option><option value="price:ASC">{t("priceLowToHigh")}</option><option value="price:DESC">{t("priceHighToLow")}</option></Select></div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2"><Button type="button" onClick={applyFilters}>{t("applyFilters")}</Button><Button type="button" variant="ghost" onClick={clearFilters}>{t("clearFilters")}</Button>{filterError ? <p className="text-sm text-destructive" role="alert">{t("invalidPriceRange")}</p> : null}</div>
      </div>

      {query.isPending ? <CatalogLoading /> : null}
      {query.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium">{t("loadError")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{query.error instanceof ApiClientError && query.error.messageKey === ApiMessageKey.SERVICE_UNAVAILABLE ? common("backendUnavailable") : common("unknownError")}</p>
          <Button className="mt-5" variant="outline" onClick={() => void query.refetch()}>{common("retry")}</Button>
        </div>
      ) : null}
      {!query.isPending && !query.isError ? <div
        className={cn("transition-opacity duration-200", query.isFetching && "opacity-60")}
        aria-busy={query.isFetching}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t("resultCount", {count: query.data?.size ?? products.length})}</p>
          {activeFilters.length > 0 ? <div className="flex flex-wrap justify-end gap-2" aria-label={t("filteredResults")}>{activeFilters.map(({key, label}) => <button key={key} type="button" className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/35 hover:bg-primary/5 hover:text-foreground" onClick={() => removeFilter(key)} aria-label={`${t("removeFilter")}: ${label}`}>{label}<X className="size-3.5" aria-hidden="true" /></button>)}</div> : null}
        </div>
        <ProductGrid products={products} compareIds={compareIds} onClearFilters={activeFilters.length > 0 ? clearFilters : undefined} onCompareToggle={(product) => {
          if (!product.id) return;
          setCompareIds((current) => current.includes(product.id!) ? current.filter((id) => id !== product.id) : current.length < 5 ? [...current, product.id!] : current);
        }} />
        <CompareTray products={products} ids={compareIds} onClear={() => setCompareIds([])} />
        {(query.data?.hasPrev || query.data?.hasNext) ? <div className="mt-8 flex justify-center gap-2"><Button variant="outline" disabled={!query.data?.hasPrev || !query.data?.prevCursor} onClick={() => movePage(query.data?.prevCursor)}><ChevronLeft className="size-4" />{t("previous")}</Button><Button variant="outline" disabled={!query.data?.hasNext || !query.data?.nextCursor} onClick={() => movePage(query.data?.nextCursor)}>{t("next")}<ChevronRight className="size-4" /></Button></div> : null}
      </div> : null}
    </section>
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
  const selected = useMemo(
    () => ids.map((id) => products.find((product) => product.id === id)).filter(Boolean),
    [ids, products],
  );
  if (ids.length === 0) return null;

  const compareHref = `/assistant?mode=COMPARE&productIds=${encodeURIComponent(ids.join(","))}`;
  return (
    <div className="sticky bottom-4 z-20 mt-7 rounded-2xl border border-primary/20 bg-background/95 p-3 shadow-xl shadow-slate-950/10 backdrop-blur sm:p-4" role="region" aria-label={t("compareTray")}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <SlidersHorizontal className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{t("compareTrayTitle", {count: ids.length})}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {selected.map((product) => product?.name).filter(Boolean).join(" · ") || t("compareTrayHint")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            <X className="size-4" />
            {t("clearCompare")}
          </Button>
          <Link
            href={ids.length >= 2 ? compareHref : "/assistant?mode=COMPARE"}
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
  sortBy?: string;
  sortDirection?: string;
};

function syncCatalogUrl(router: ReturnType<typeof useRouter>, filters: CatalogUrlFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  router.replace(query ? `/products?${query}` : "/products");
}

function formatFilterValue(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function flattenCategories(categories: import("@/features/catalog/contracts/responses").CategoryTree[], depth = 0): {id: string; label: string}[] {
  return categories.flatMap((category) => [
    ...(category.id ? [{id: category.id, label: `${"— ".repeat(depth)}${category.name ?? ""}`}] : []),
    ...flattenCategories(category.children ?? [], depth + 1),
  ]);
}

function quickCategories(categories: import("@/features/catalog/contracts/responses").CategoryTree[]) {
  return categories.flatMap((category) => category.children?.length ? category.children : [category]).filter((category) => category.id && category.name);
}

function CatalogLoading() {
  return <ProductGridSkeleton count={8} />;
}
