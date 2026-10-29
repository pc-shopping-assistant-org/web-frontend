"use client";

import {ChevronDown, Plus, Search} from "lucide-react";
import Image from "next/image";
import {useLocale, useTranslations} from "next-intl";
import {useState, type FormEvent} from "react";

import {Button, buttonVariants} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {ConfirmAction} from "@/components/ui/confirm-action";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusBadge} from "@/components/ui/status-badge";
import {CatalogCategoryIcon} from "@/features/catalog/components/catalog-category-icon";
import type {ProductSummary} from "@/features/catalog/contracts/responses";
import {useBrands, useCategories} from "@/features/catalog/queries";
import {Link} from "@/i18n/navigation";
import {ResourceStatus} from "@/lib/domain/catalog-enums";
import {formatMoney} from "@/lib/format";
import {cn} from "@/lib/utils";

import {AdminPagination} from "./admin-pagination";
import {flattenCategories, toNumber} from "./list-helpers";
import {useAdminProducts, useAdminProductStatus, useDeleteAdminProduct} from "./queries";

const PAGE_SIZE = 20;
const TABS = ["", ResourceStatus.Active, ResourceStatus.Inactive] as const;

const EMPTY_FILTERS = {keyword: "", categoryId: "", brandId: "", minPrice: "", maxPrice: ""};

/**
 * The shop's product list, laid out like a seller centre: tabs by status, one row of filters, then a table of
 * products with their price, stock and the few things a seller does to one (open it, stop selling, delete).
 */
export function ProductListPage() {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.productList");
  const categories = useCategories();
  const brands = useBrands();
  const [status, setStatus] = useState<string>("");
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [pageNumber, setPageNumber] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const query = useAdminProducts({
    limit: PAGE_SIZE,
    page: pageNumber,
    keyword: applied.keyword || undefined,
    status: status || undefined,
    categoryId: applied.categoryId || undefined,
    brandId: applied.brandId || undefined,
    minPrice: toNumber(applied.minPrice),
    maxPrice: toNumber(applied.maxPrice),
  });
  const statusMutation = useAdminProductStatus();
  const remove = useDeleteAdminProduct();
  const page = query.data;
  const filtered = Boolean(applied.keyword || applied.categoryId || applied.brandId || applied.minPrice || applied.maxPrice);

  function apply(event?: FormEvent) {
    event?.preventDefault();
    setApplied({...draft, keyword: draft.keyword.trim()});
    setPageNumber(0);
  }
  function reset() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPageNumber(0);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("resource.products")}</h1>
        <Link href="/admin/products/new" className={buttonVariants({size: "lg"})}>
          <Plus className="size-4" />
          {tl("addNew")}
        </Link>
      </div>

      <div role="tablist" aria-label={t("status")} className="flex gap-6 overflow-x-auto overflow-y-hidden border-b">
        {TABS.map((tab) => (
          <button
            key={tab || "all"}
            type="button"
            role="tab"
            aria-selected={status === tab}
            onClick={() => {
              setStatus(tab);
              setPageNumber(0);
            }}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-1 pb-3 text-sm transition",
              status === tab ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab ? t(`statusValues.${tab}`) : tl("all")}
          </button>
        ))}
      </div>

      <Card className="p-4 sm:p-5">
        <form className="space-y-3" onSubmit={apply}>
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={draft.keyword}
                onChange={(event) => setDraft((current) => ({...current, keyword: event.target.value}))}
                placeholder={tl("searchPlaceholder")}
                aria-label={tl("searchPlaceholder")}
              />
            </div>
            <Select
              className="w-full sm:w-56"
              aria-label={t("category")}
              value={draft.categoryId}
              onChange={(event) => setDraft((current) => ({...current, categoryId: event.target.value}))}
            >
              <option value="">{t("allCategories")}</option>
              {flattenCategories(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </Select>
            <Select
              className="w-full sm:w-48"
              aria-label={t("brand")}
              value={draft.brandId}
              onChange={(event) => setDraft((current) => ({...current, brandId: event.target.value}))}
            >
              <option value="">{t("allBrands")}</option>
              {(brands.data ?? [])
                .filter((brand) => brand.status === ResourceStatus.Active)
                .map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
            </Select>
            <div className="flex gap-2">
              <Button type="submit" variant="outline" className="border-primary text-primary hover:bg-primary/5" size="field">
                {tl("apply")}
              </Button>
              <Button type="button" variant="outline" size="field" onClick={reset}>
                {tl("reset")}
              </Button>
              <Button type="button" variant="ghost" size="field" aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}>
                {tl("more")}
                <ChevronDown className={cn("size-4 transition", moreOpen && "rotate-180")} />
              </Button>
            </div>
          </div>
          {moreOpen ? (
            <div className="grid gap-3 border-t pt-3 sm:grid-cols-2 lg:max-w-xl">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-muted-foreground">{t("minPrice")}</span>
                <Input
                  type="number"
                  min={0}
                  value={draft.minPrice}
                  onChange={(event) => setDraft((current) => ({...current, minPrice: event.target.value}))}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-muted-foreground">{t("maxPrice")}</span>
                <Input
                  type="number"
                  min={0}
                  value={draft.maxPrice}
                  onChange={(event) => setDraft((current) => ({...current, maxPrice: event.target.value}))}
                />
              </label>
            </div>
          ) : null}
        </form>

        {query.isPending ? (
          <Skeleton className="mt-5 h-64 rounded-xl" />
        ) : query.isError ? (
          <div className="mt-5">
            <ErrorMessage error={query.error} />
          </div>
        ) : (
          <>
            <p className="mt-5 text-sm font-medium">{tl("showing", {count: page?.items.length ?? 0})}</p>
            {(page?.items ?? []).length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
                {filtered || status ? tl("emptyFiltered") : tl("empty")}
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[52rem] border-collapse text-sm">
                  <thead className="bg-muted/50 text-left text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">
                        {tl("name")}
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        {tl("price")}
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        {tl("stock")}
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        {t("status")}
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        {tl("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(page?.items ?? []).map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        busy={statusMutation.isPending}
                        onStatus={(next) => statusMutation.mutateAsync({id: product.id, status: next})}
                        onDelete={() => remove.mutateAsync(product.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {page?.totalPages && page.totalPages > 1 ? (
              <div className="mt-5">
                <AdminPagination page={page.page ?? 0} totalPages={page.totalPages} onPageChange={setPageNumber} />
              </div>
            ) : null}
          </>
        )}
        {statusMutation.isError ? (
          <div className="mt-4">
            <ErrorMessage error={statusMutation.error} />
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function ProductRow({
  product,
  busy,
  onStatus,
  onDelete,
}: {
  product: ProductSummary;
  busy: boolean;
  onStatus: (status: string) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.productList");
  const locale = useLocale();
  const active = product.status === ResourceStatus.Active;
  const variants = product.variantCount ?? 0;
  const stock = product.totalQuantity ?? 0;
  return (
    <tr className="border-t align-top transition hover:bg-muted/20">
      <td className="px-4 py-4">
        <div className="flex gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border bg-muted/60">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt="" fill sizes="56px" unoptimized className="object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-primary/45">
                <CatalogCategoryIcon categoryName={product.categoryName ?? product.name} className="size-6" strokeWidth={1.45} />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <Link href={`/admin/products/${product.id}`} className="line-clamp-2 font-medium hover:text-primary hover:underline">
              {product.name}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {product.brandName ?? t("noBrand")} · {product.categoryName ?? t("uncategorized")}
            </p>
            <p className={cn("mt-0.5 text-xs", variants === 0 ? "font-medium text-amber-600" : "text-muted-foreground")}>
              {variants === 0 ? tl("noVariants") : tl("variantCount", {count: variants})}
            </p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        {variants === 0 ? (
          "—"
        ) : (
          <>
            {formatMoney(product.minPrice, locale)}
            {product.maxPrice !== product.minPrice ? (
              <span className="text-muted-foreground"> – {formatMoney(product.maxPrice, locale)}</span>
            ) : null}
          </>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        {variants === 0 ? "—" : stock === 0 ? <span className="font-medium text-destructive">{tl("outOfStock")}</span> : stock}
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={product.status} />
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col items-start gap-1.5 text-sm">
          <Link href={`/admin/products/${product.id}`} className="font-medium text-primary hover:underline">
            {tl("update")}
          </Link>
          {active ? (
            <ConfirmAction
              title={t("confirmStatusChange")}
              description={t("statusChangeDescription", {status: t(`statusValues.${ResourceStatus.Inactive}`)})}
              confirmLabel={tl("deactivate")}
              cancelLabel={t("cancel")}
              onConfirm={() => onStatus(ResourceStatus.Inactive)}
              variant="link"
              size="xs"
              className="h-auto p-0 text-sm font-medium text-primary"
              disabled={busy}
            >
              {tl("deactivate")}
            </ConfirmAction>
          ) : (
            <Button
              type="button"
              variant="link"
              size="xs"
              className="h-auto p-0 text-sm font-medium"
              disabled={busy}
              onClick={() => void onStatus(ResourceStatus.Active).catch(() => undefined)}
            >
              {tl("activate")}
            </Button>
          )}
          <ConfirmAction
            title={t("delete")}
            description={t("confirmDelete")}
            confirmLabel={t("delete")}
            cancelLabel={t("cancel")}
            onConfirm={onDelete}
            variant="link"
            size="xs"
            className="h-auto p-0 text-sm font-medium text-destructive"
          >
            {t("delete")}
          </ConfirmAction>
        </div>
      </td>
    </tr>
  );
}
