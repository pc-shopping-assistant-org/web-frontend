"use client";

import {ChevronLeft, ChevronRight, Search, SlidersHorizontal} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import {ApiClientError} from "@/lib/api/envelope";

import {useBrands, useCategories, useProducts} from "../queries";
import {ProductGrid} from "./product-grid";

export function CatalogPage() {
  const t = useTranslations("catalog");
  const common = useTranslations("common");
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState({limit: 12, cursor: undefined as string | undefined, keyword: undefined as string | undefined, categoryId: undefined as string | undefined, brandId: undefined as string | undefined, minPrice: undefined as number | undefined, maxPrice: undefined as number | undefined, sortBy: "createdAt", sortDirection: "DESC"});
  const [draft, setDraft] = useState(filters);
  const query = useProducts(filters);
  const categories = useCategories();
  const brands = useBrands();
  const products = query.data?.items ?? [];

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
            setFilters((current) => ({...current, keyword: term.trim() || undefined, cursor: undefined}));
          }}
        >
          <Input value={term} onChange={(event) => setTerm(event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} />
          <Button type="submit"><Search className="size-4" />{t("search")}</Button>
        </form>
      </div>

      <div className="mb-8 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="size-4" />{t("filters")}</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2"><Label htmlFor="category">{t("category")}</Label><Select id="category" value={draft.categoryId ?? ""} onChange={(event) => setDraft((current) => ({...current, categoryId: event.target.value || undefined}))}><option value="">{t("allCategories")}</option>{flattenCategories(categories.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</Select></div>
          <div className="space-y-2"><Label htmlFor="brand">{t("brand")}</Label><Select id="brand" value={draft.brandId ?? ""} onChange={(event) => setDraft((current) => ({...current, brandId: event.target.value || undefined}))}><option value="">{t("allBrands")}</option>{(brands.data ?? []).filter((brand) => brand.status === "ACTIVE").map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</Select></div>
          <div className="space-y-2"><Label htmlFor="min-price">{t("minPrice")}</Label><Input id="min-price" type="number" min="0" value={draft.minPrice ?? ""} onChange={(event) => setDraft((current) => ({...current, minPrice: event.target.value ? Number(event.target.value) : undefined}))} /></div>
          <div className="space-y-2"><Label htmlFor="max-price">{t("maxPrice")}</Label><Input id="max-price" type="number" min="0" value={draft.maxPrice ?? ""} onChange={(event) => setDraft((current) => ({...current, maxPrice: event.target.value ? Number(event.target.value) : undefined}))} /></div>
          <div className="space-y-2"><Label htmlFor="sort">{t("sort")}</Label><Select id="sort" value={`${draft.sortBy}:${draft.sortDirection}`} onChange={(event) => {const [sortBy, sortDirection] = event.target.value.split(":"); setDraft((current) => ({...current, sortBy, sortDirection}));}}><option value="createdAt:DESC">{t("newest")}</option><option value="price:ASC">{t("priceLowToHigh")}</option><option value="price:DESC">{t("priceHighToLow")}</option></Select></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => setFilters({...draft, keyword: filters.keyword, cursor: undefined})}>{t("applyFilters")}</Button><Button variant="ghost" onClick={() => {const reset = {limit: 12, cursor: undefined, keyword: filters.keyword, categoryId: undefined, brandId: undefined, minPrice: undefined, maxPrice: undefined, sortBy: "createdAt", sortDirection: "DESC"}; setDraft(reset); setFilters(reset);}}>{t("clearFilters")}</Button></div>
      </div>

      {query.isPending ? <CatalogLoading /> : null}
      {query.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium">{t("loadError")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{query.error instanceof ApiClientError && query.error.messageKey === "SERVICE_UNAVAILABLE" ? common("backendUnavailable") : common("unknownError")}</p>
          <Button className="mt-5" variant="outline" onClick={() => void query.refetch()}>{common("retry")}</Button>
        </div>
      ) : null}
      {!query.isPending && !query.isError ? <ProductGrid products={products} /> : null}
      {!query.isPending && !query.isError && (query.data?.hasPrev || query.data?.hasNext) ? <div className="mt-8 flex justify-center gap-2"><Button variant="outline" disabled={!query.data?.hasPrev || !query.data?.prevCursor} onClick={() => setFilters((current) => ({...current, cursor: query.data?.prevCursor}))}><ChevronLeft className="size-4" />{t("previous")}</Button><Button variant="outline" disabled={!query.data?.hasNext || !query.data?.nextCursor} onClick={() => setFilters((current) => ({...current, cursor: query.data?.nextCursor}))}>{t("next")}<ChevronRight className="size-4" /></Button></div> : null}
    </section>
  );
}

function flattenCategories(categories: import("@/lib/api/types").CategoryTree[], depth = 0): {id: string; label: string}[] {
  return categories.flatMap((category) => [
    ...(category.id ? [{id: category.id, label: `${"— ".repeat(depth)}${category.name ?? ""}`}] : []),
    ...flattenCategories(category.children ?? [], depth + 1),
  ]);
}

function CatalogLoading() {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length: 6}, (_, index) => <div key={index} className="h-96 animate-pulse rounded-2xl bg-muted" />)}</div>;
}
