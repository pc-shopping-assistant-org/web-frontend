"use client";

import { useCursorTrail } from "@/lib/hooks/use-cursor-trail";
import Image from "next/image";
import { CreditCard, Eye, Search, Star, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format";
import {AccountStatus} from "@/lib/domain/account-enums";
import {DiscountStatus, DiscountState, DiscountType, OrderStatus, PaymentStatus} from "@/lib/domain/commerce-enums";
import {ResourceStatus, ReviewStatus} from "@/lib/domain/catalog-enums";
import type {CategoryTree, Review} from "@/features/catalog/contracts/responses";
import type {PaymentDetail} from "@/features/admin/contracts/responses";

import { useBrands, useCategories } from "@/features/catalog/queries";
import { CatalogCategoryIcon } from "@/features/catalog/components/catalog-category-icon";
import { ProductCreateForm } from "./catalog-management";
import { ConfirmAction } from "./confirm-action";
import { StatusSelect } from "./status-select";
import {
  DiscountCreateForm,
  EmployeeCreateForm,
  SupplierCreateForm,
} from "./management-forms";
import {
  useAdminCustomerStatus,
  useAdminCustomers,
  useAdminDiscountStatus,
  useAdminDiscounts,
  useAdminEmployeeStatus,
  useAdminEmployees,
  useAdminPaymentMethods,
  useAdminPaymentStatus,
  useAdminPayments,
  useAdminProductStatus,
  useAdminProducts,
  useAdminReviewStatus,
  useAdminReviews,
  useAdminSuppliers,
  useDeleteAdminProduct,
  useRoles,
} from "./queries";
import { AdminPagination } from "./admin-pagination";
import { AdminOrderStatusControl } from "@/features/orders/admin-order-status";
import { useAdminOrders } from "@/features/orders/queries";

export type AdminResource =
  | "products"
  | "orders"
  | "customers"
  | "employees"
  | "discounts"
  | "suppliers"
  | "payments"
  | "payment-methods"
  | "reviews";

export function AdminResourcePage({ resource }: { resource: AdminResource }) {
  switch (resource) {
    case "products":
      return <Products />;
    case "orders":
      return <Orders />;
    case "customers":
      return <Customers />;
    case "employees":
      return <Employees />;
    case "discounts":
      return <Discounts />;
    case "suppliers":
      return <Suppliers />;
    case "payments":
      return <Payments />;
    case "payment-methods":
      return <PaymentMethods />;
    case "reviews":
      return <Reviews />;
  }
}

function Heading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const t = useTranslations("admin");
  return (
    <div className="mb-8 flex flex-col gap-2 border-b border-border/70 pb-6">
      <p className="eyebrow">{t("label")}</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="max-w-3xl text-muted-foreground">{description}</p>
    </div>
  );
}

function Shell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Heading title={title} description={description} />
      {children}
    </div>
  );
}

function FilterBar({
  value,
  onChange,
  placeholder,
  onSubmit,
  onReset,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onSubmit: () => void;
  onReset?: () => void;
  children?: ReactNode;
}) {
  const t = useTranslations("admin");
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="field">
                <Search className="size-4" />
                {t("search")}
              </Button>
              {onReset ? (
                <Button type="button" size="field" variant="outline" onClick={onReset}>
                  {t("clearFilters")}
                </Button>
              ) : null}
            </div>
          </div>
          {children ? (
            <div className="grid gap-3 border-t pt-3 sm:grid-cols-2 lg:grid-cols-4">
              {children}
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <Select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </Select>
    </label>
  );
}

function DateFilter({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Loading() {
  return <Skeleton className="h-64 rounded-2xl" />;
}
function Failure({ error }: { error: unknown }) {
  return <ErrorMessage error={error} />;
}

function EmptyState({ title }: { title?: string }) {
  const t = useTranslations("admin");
  return (
    <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
      {title ?? t("noResults")}
    </div>
  );
}

type CursorPage = {
  hasPrev?: boolean;
  hasNext?: boolean;
  prevCursor?: string;
  nextCursor?: string;
  size?: number;
};

function PageSummary({ page }: { page?: CursorPage }) {
  const t = useTranslations("admin");
  if (!page?.size) return null;
  return (
    <p className="text-xs text-muted-foreground">
      {t("showingItems", { count: page.size })}
    </p>
  );
}

function StatusOptions({
  kind,
}: {
  kind:
    | "account"
    | "product"
    | "discount"
    | "payment"
    | "review"
    | "order"
    | "supplier";
}) {
  const t = useTranslations("admin");
  const label = (status: string) =>
    t.has(`statusValues.${status}`) ? t(`statusValues.${status}`) : status;
  if (kind === "order")
    return (
      <>
        <option value="">{t("allStatuses")}</option>
        {ORDER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {label(status)}
          </option>
        ))}
      </>
    );
  if (kind === "payment")
    return (
      <>
        <option value="">{t("allStatuses")}</option>
        {Object.values(PaymentStatus).map((status) => (
          <option key={status} value={status}>
            {label(status)}
          </option>
        ))}
      </>
    );
  if (kind === "review")
    return (
      <>
        <option value="">{t("allStatuses")}</option>
        {Object.values(ReviewStatus).map((status) => (
          <option key={status} value={status}>
            {label(status)}
          </option>
        ))}
      </>
    );
  const statuses =
    kind === "account"
      ? [AccountStatus.Active, AccountStatus.Inactive, AccountStatus.Locked]
      : kind === "discount"
        ? [DiscountStatus.Active, DiscountStatus.Inactive]
        : [ResourceStatus.Active, ResourceStatus.Inactive];
  return (
    <>
      <option value="">{t("allStatuses")}</option>
      {statuses.map((status) => (
        <option key={status} value={status}>
          {label(status)}
        </option>
      ))}
    </>
  );
}

const ORDER_STATUSES = Object.values(OrderStatus);

function paymentStatusOptions(current?: string) {
  return current === PaymentStatus.Pending
    ? Object.values(PaymentStatus)
    : [current ?? PaymentStatus.Pending];
}

function Products() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const categories = useCategories();
  const brands = useBrands();
  const [draft, setDraft] = useState({
    keyword: "",
    status: "",
    categoryId: "",
    brandId: "",
    minPrice: "",
    maxPrice: "",
  });
  const [applied, setApplied] = useState({
    ...draft,
    cursor: undefined as string | undefined,
  });
  const query = useAdminProducts({
    limit: 20,
    cursor: applied.cursor,
    keyword: applied.keyword || undefined,
    status: applied.status || undefined,
    categoryId: applied.categoryId || undefined,
    brandId: applied.brandId || undefined,
    minPrice: toNumber(applied.minPrice),
    maxPrice: toNumber(applied.maxPrice),
  });
  const trail = useCursorTrail(JSON.stringify({ ...applied, cursor: undefined }));
  const mutation = useAdminProductStatus();
  const remove = useDeleteAdminProduct();
  const apply = () =>
    setApplied({ ...draft, keyword: draft.keyword.trim(), cursor: undefined });
  const reset = () => {
    const empty = {
      keyword: "",
      status: "",
      categoryId: "",
      brandId: "",
      minPrice: "",
      maxPrice: "",
    };
    setDraft(empty);
    setApplied({ ...empty, cursor: undefined });
  };
  const page = query.data
    ? { ...query.data, hasPrev: trail.hasPrev, prevCursor: trail.prevCursor }
    : undefined;
  return (
    <Shell
      title={t("resource.products")}
      description={t("resource.productsDescription")}
    >
      <ProductCreateForm />
      <FilterBar
        value={draft.keyword}
        onChange={(value) =>
          setDraft((current) => ({ ...current, keyword: value }))
        }
        placeholder={t("searchProducts")}
        onSubmit={apply}
        onReset={reset}
      >
        <FilterSelect
          id="product-status"
          label={t("status")}
          value={draft.status}
          onChange={(value) =>
            setDraft((current) => ({ ...current, status: value }))
          }
        >
          <StatusOptions kind="product" />
        </FilterSelect>
        <FilterSelect
          id="product-category-filter"
          label={t("category")}
          value={draft.categoryId}
          onChange={(value) =>
            setDraft((current) => ({ ...current, categoryId: value }))
          }
        >
          <option value="">{t("allCategories")}</option>
          {flattenCategories(categories.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id="product-brand-filter"
          label={t("brand")}
          value={draft.brandId}
          onChange={(value) =>
            setDraft((current) => ({ ...current, brandId: value }))
          }
        >
          <option value="">{t("allBrands")}</option>
          {(brands.data ?? [])
            .filter((brand) => brand.status === ResourceStatus.Active)
            .map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
        </FilterSelect>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-muted-foreground">
              {t("minPrice")}
            </span>
            <Input
              type="number"
              min={0}
              value={draft.minPrice}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  minPrice: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-muted-foreground">
              {t("maxPrice")}
            </span>
            <Input
              type="number"
              min={0}
              value={draft.maxPrice}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  maxPrice: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </FilterBar>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} />
      ) : (
        <>
          {(page?.items ?? []).length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {(page?.items ?? []).map((product, index) => (
                <Card
                  key={product.id ?? index}
                  className="transition hover:border-primary/30 hover:shadow-md"
                >
                  <CardContent className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted/60">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name ?? ""}
                          fill
                          sizes="64px"
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-primary/45">
                          <CatalogCategoryIcon
                            categoryName={product.categoryName ?? product.name}
                            className="size-8"
                            strokeWidth={1.45}
                          />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {product.id ? (
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-semibold hover:text-primary hover:underline"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          <p className="font-semibold">{product.name}</p>
                        )}
                        <StatusBadge status={product.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {product.brandName ?? t("noBrand")} ·{" "}
                        {product.categoryName ?? t("uncategorized")}
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatMoney(product.minPrice, locale)}
                        {product.maxPrice &&
                        product.maxPrice !== product.minPrice
                          ? ` – ${formatMoney(product.maxPrice, locale)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.id ? (
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
                        >
                          <Eye className="size-3.5" />
                          <span className="hidden sm:inline">{t("view")}</span>
                        </Link>
                      ) : null}
                      <StatusSelect
                        currentStatus={product.status}
                        options={[ResourceStatus.Active, ResourceStatus.Inactive]}
                        label={t("status")}
                        onStatus={(status) =>
                          mutation.mutateAsync({
                            id: product.id ?? "",
                            status,
                          })
                        }
                        className="h-9 w-32"
                        disabled={!product.id || mutation.isPending}
                      />
                      {product.id ? (
                        <ConfirmAction
                          title={t("delete")}
                          description={t("confirmDelete")}
                          confirmLabel={t("delete")}
                          cancelLabel={t("cancel")}
                          onConfirm={() => remove.mutateAsync(product.id!)}
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          ariaLabel={t("delete")}
                        >
                          <Trash2 className="size-4" />
                        </ConfirmAction>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <ListFooter
            page={page}
            onPrev={() => {
              const cursor = trail.prevCursor;
              trail.pop();
              setApplied((current) => ({ ...current, cursor }));
            }}
            onNext={() => {
              trail.push(applied.cursor);
              setApplied((current) => ({
                ...current,
                cursor: page?.nextCursor,
              }));
            }}
          />
        </>
      )}
      {mutation.isError ? (
        <div className="mt-4">
          <Failure error={mutation.error} />
        </div>
      ) : null}
    </Shell>
  );
}

function Orders() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const requestedStatus = searchParams.get("status") ?? "";
  const initialStatus = (ORDER_STATUSES as readonly string[]).includes(
    requestedStatus,
  )
    ? requestedStatus
    : "";
  const [draft, setDraft] = useState(() => ({
    keyword: "",
    status: initialStatus,
    fromDate: "",
    toDate: "",
  }));
  const [applied, setApplied] = useState(draft);
  const [pageNumber, setPageNumber] = useState(0);
  const [actionError, setActionError] = useState<unknown>(null);
  const query = useAdminOrders({
    page: pageNumber,
    size: 20,
    keyword: applied.keyword || undefined,
    status: applied.status || undefined,
    createdFrom: dateParam(applied.fromDate, false),
    createdTo: dateParam(applied.toDate, true),
  });
  const apply = () => {
    setApplied({ ...draft, keyword: draft.keyword.trim() });
    setPageNumber(0);
    setActionError(null);
  };
  const reset = () => {
    const empty = { keyword: "", status: "", fromDate: "", toDate: "" };
    setDraft(empty);
    setApplied(empty);
    setPageNumber(0);
    setActionError(null);
  };
  const page = query.data;
  return (
    <Shell
      title={t("resource.orders")}
      description={t("resource.ordersDescription")}
    >
      <FilterBar
        value={draft.keyword}
        onChange={(value) =>
          setDraft((current) => ({ ...current, keyword: value }))
        }
        placeholder={t("searchOrders")}
        onSubmit={apply}
        onReset={reset}
      >
        <FilterSelect
          id="order-status"
          label={t("status")}
          value={draft.status}
          onChange={(value) =>
            setDraft((current) => ({ ...current, status: value }))
          }
        >
          <StatusOptions kind="order" />
        </FilterSelect>
        <DateFilter
          id="order-from"
          label={t("fromDate")}
          value={draft.fromDate}
          onChange={(value) =>
            setDraft((current) => ({ ...current, fromDate: value }))
          }
        />
        <DateFilter
          id="order-to"
          label={t("toDate")}
          value={draft.toDate}
          onChange={(value) =>
            setDraft((current) => ({ ...current, toDate: value }))
          }
        />
      </FilterBar>
      {actionError ? <div className="mb-4"><Failure error={actionError} /></div> : null}
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} />
      ) : (
        <>
          {(page?.items ?? []).length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {(page?.items ?? []).map((order) => (
                <Card
                  key={order.id}
                  className="transition hover:border-primary/30 hover:shadow-md"
                >
                  <CardContent className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-semibold hover:text-primary hover:underline"
                        >
                          {order.invoiceNumber}
                        </Link>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.recipientName ?? t("guestCustomer")}
                        {order.recipientPhone ? ` · ${order.recipientPhone}` : ""}
                        {" · "}
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString(
                              locale === "vi" ? "vi-VN" : "en-US",
                            )
                          : "—"}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {order.firstProductName ?? "—"}
                        {order.itemCount > 1 ? ` ${t("moreItems", { count: order.itemCount - 1 })}` : ""}
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatMoney(order.totalAmount, locale)}
                      </p>
                    </div>
                    <AdminOrderStatusControl orderId={order.id} status={order.status} onError={setActionError} />
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <Eye className="size-3.5" />
                      <span className="hidden sm:inline">{t("view")}</span>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {page && page.totalPages > 1 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t("pageOf", { page: page.page + 1, total: page.totalPages })}
                {" · "}
                {t("totalOrders", { count: page.totalElements })}
              </p>
              <AdminPagination
                hasPrev={page.page > 0}
                hasNext={!page.last}
                onPrev={() => {
                  setPageNumber((current) => Math.max(0, current - 1));
                  setActionError(null);
                }}
                onNext={() => {
                  setPageNumber((current) => current + 1);
                  setActionError(null);
                }}
              />
            </div>
          ) : null}
        </>
      )}
    </Shell>
  );
}

function Customers() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [draft, setDraft] = useState({ keyword: "", status: "" });
  const [applied, setApplied] = useState({
    ...draft,
    cursor: undefined as string | undefined,
  });
  const query = useAdminCustomers({
    limit: 20,
    cursor: applied.cursor,
    keyword: applied.keyword || undefined,
    status: applied.status || undefined,
  });
  const mutation = useAdminCustomerStatus();
  const apply = () =>
    setApplied({ ...draft, keyword: draft.keyword.trim(), cursor: undefined });
  const reset = () => {
    const empty = { keyword: "", status: "" };
    setDraft(empty);
    setApplied({ ...empty, cursor: undefined });
  };
  const page = query.data;
  return (
    <Shell
      title={t("resource.customers")}
      description={t("resource.customersDescription")}
    >
      <FilterBar
        value={draft.keyword}
        onChange={(value) =>
          setDraft((current) => ({ ...current, keyword: value }))
        }
        placeholder={t("searchCustomers")}
        onSubmit={apply}
        onReset={reset}
      >
        <FilterSelect
          id="customer-status"
          label={t("status")}
          value={draft.status}
          onChange={(value) =>
            setDraft((current) => ({ ...current, status: value }))
          }
        >
          <StatusOptions kind="account" />
        </FilterSelect>
      </FilterBar>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} />
      ) : (
        <>
          <ListRows
            rows={(page?.items ?? []).map((customer) => ({
              id: customer.accountId ?? customer.id,
              title: customer.fullName ?? "—",
              meta: `${customer.email ?? "—"} · ${customer.phone ?? "—"} · ${customer.totalOrders ?? 0} ${t("ordersShort")} · ${formatMoney(customer.totalSpent, locale)}`,
              status: customer.status,
              href:
                (customer.accountId ?? customer.id)
                  ? `/admin/customers/${customer.accountId ?? customer.id}`
                  : undefined,
            }))}
            onStatus={(id, value) =>
              mutation.mutateAsync({ id, status: value })
            }
            kind="account"
          />
          <ListFooter
            page={page}
            onPrev={() =>
              setApplied((current) => ({
                ...current,
                cursor: page?.prevCursor,
              }))
            }
            onNext={() =>
              setApplied((current) => ({
                ...current,
                cursor: page?.nextCursor,
              }))
            }
          />
        </>
      )}
      {mutation.isError ? (
        <div className="mt-4">
          <Failure error={mutation.error} />
        </div>
      ) : null}
    </Shell>
  );
}

function Employees() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const roles = useRoles();
  const [draft, setDraft] = useState({ keyword: "", status: "", roleName: "" });
  const [applied, setApplied] = useState({
    ...draft,
    cursor: undefined as string | undefined,
  });
  const query = useAdminEmployees({
    limit: 20,
    cursor: applied.cursor,
    keyword: applied.keyword || undefined,
    status: applied.status || undefined,
    roleName: applied.roleName || undefined,
  });
  const mutation = useAdminEmployeeStatus();
  const apply = () =>
    setApplied({ ...draft, keyword: draft.keyword.trim(), cursor: undefined });
  const reset = () => {
    const empty = { keyword: "", status: "", roleName: "" };
    setDraft(empty);
    setApplied({ ...empty, cursor: undefined });
  };
  const page = query.data;
  return (
    <Shell
      title={t("resource.employees")}
      description={t("resource.employeesDescription")}
    >
      <EmployeeCreateForm />
      <FilterBar
        value={draft.keyword}
        onChange={(value) =>
          setDraft((current) => ({ ...current, keyword: value }))
        }
        placeholder={t("searchEmployees")}
        onSubmit={apply}
        onReset={reset}
      >
        <FilterSelect
          id="employee-status"
          label={t("status")}
          value={draft.status}
          onChange={(value) =>
            setDraft((current) => ({ ...current, status: value }))
          }
        >
          <StatusOptions kind="account" />
        </FilterSelect>
        <FilterSelect
          id="employee-role-filter"
          label={t("role")}
          value={draft.roleName}
          onChange={(value) =>
            setDraft((current) => ({ ...current, roleName: value }))
          }
        >
          <option value="">{t("allRoles")}</option>
          {(roles.data ?? []).map((role) =>
            role.name ? (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ) : null,
          )}
        </FilterSelect>
      </FilterBar>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} />
      ) : (
        <>
          <ListRows
            rows={(page?.items ?? []).map((employee) => ({
              id: employee.accountId ?? employee.id,
              title: employee.fullName ?? "—",
              meta: `${employee.roleName ?? "—"} · ${employee.email ?? "—"} · ${formatMoney(employee.salary, locale)}`,
              status: employee.status,
              href:
                (employee.accountId ?? employee.id)
                  ? `/admin/employees/${employee.accountId ?? employee.id}`
                  : undefined,
            }))}
            onStatus={(id, value) =>
              mutation.mutateAsync({ id, status: value })
            }
            kind="account"
          />
          <ListFooter
            page={page}
            onPrev={() =>
              setApplied((current) => ({
                ...current,
                cursor: page?.prevCursor,
              }))
            }
            onNext={() =>
              setApplied((current) => ({
                ...current,
                cursor: page?.nextCursor,
              }))
            }
          />
        </>
      )}
      {mutation.isError ? (
        <div className="mt-4">
          <Failure error={mutation.error} />
        </div>
      ) : null}
    </Shell>
  );
}

const DISCOUNT_STATES = [DiscountState.Running, DiscountState.Scheduled, DiscountState.Expired, DiscountState.Locked];

function Discounts() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [state, setState] = useState("");
  const [pageNumber, setPageNumber] = useState(0);
  const query = useAdminDiscounts({ page: pageNumber, size: 20, state: state || undefined });
  const mutation = useAdminDiscountStatus();
  const page = query.data;
  return (
    <Shell
      title={t("resource.discounts")}
      description={t("resource.discountsDescription")}
    >
      <DiscountCreateForm />
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="w-full sm:w-64">
            <FilterSelect
              id="discount-state"
              label={t("discountState")}
              value={state}
              onChange={(value) => {
                setState(value);
                setPageNumber(0);
              }}
            >
              <option value="">{t("allStates")}</option>
              {DISCOUNT_STATES.map((value) => (
                <option key={value} value={value}>
                  {t(`statusValues.${value}`)}
                </option>
              ))}
            </FilterSelect>
          </div>
          <Button
            type="button"
            size="field"
            variant="outline"
            onClick={() => {
              setState("");
              setPageNumber(0);
            }}
          >
            {t("clearFilters")}
          </Button>
        </CardContent>
      </Card>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} />
      ) : (
        <>
          {(page?.items ?? []).length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {(page?.items ?? []).map((discount) => (
                <Card
                  key={discount.id}
                  className="transition hover:border-primary/30 hover:shadow-md"
                >
                  <CardContent className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/discounts/${discount.id}`}
                          className="font-semibold hover:text-primary hover:underline"
                        >
                          {discount.code ?? discount.title}
                        </Link>
                        <StatusBadge status={discount.state} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {discount.title} · {t(`scopeValues.${discount.applicationScope}`)} ·{" "}
                        {discount.discountType === DiscountType.Percent
                          ? `${discount.value}%`
                          : formatMoney(discount.value, locale)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(discount.startAt ?? "").toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}
                        {" – "}
                        {new Date(discount.endAt ?? "").toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}
                        {" · "}
                        {t("minOrderAmount")} {formatMoney(discount.minOrderAmount, locale)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/discounts/${discount.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        <Eye className="size-3.5" />
                        <span className="hidden sm:inline">{t("view")}</span>
                      </Link>
                      <StatusSelect
                        currentStatus={discount.status}
                        options={[DiscountStatus.Active, DiscountStatus.Inactive]}
                        label={t("status")}
                        onStatus={(status) =>
                          mutation.mutateAsync({ id: discount.id, status })
                        }
                        disabled={mutation.isPending}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {page && page.totalPages > 1 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t("pageOf", { page: page.page + 1, total: page.totalPages })}
              </p>
              <AdminPagination
                hasPrev={page.page > 0}
                hasNext={!page.last}
                onPrev={() => setPageNumber((current) => Math.max(0, current - 1))}
                onNext={() => setPageNumber((current) => current + 1)}
              />
            </div>
          ) : null}
        </>
      )}
      {mutation.isError ? (
        <div className="mt-4">
          <Failure error={mutation.error} />
        </div>
      ) : null}
    </Shell>
  );
}

function Suppliers() {
  const t = useTranslations("admin");
  const [draft, setDraft] = useState({ keyword: "", status: "" });
  const [applied, setApplied] = useState({
    ...draft,
    cursor: undefined as string | undefined,
  });
  const query = useAdminSuppliers({
    limit: 20,
    cursor: applied.cursor,
    keyword: applied.keyword || undefined,
    status: applied.status || undefined,
  });
  const apply = () =>
    setApplied({ ...draft, keyword: draft.keyword.trim(), cursor: undefined });
  const reset = () => {
    const empty = { keyword: "", status: "" };
    setDraft(empty);
    setApplied({ ...empty, cursor: undefined });
  };
  const page = query.data;
  return (
    <Shell
      title={t("resource.suppliers")}
      description={t("resource.suppliersDescription")}
    >
      <SupplierCreateForm />
      <FilterBar
        value={draft.keyword}
        onChange={(value) =>
          setDraft((current) => ({ ...current, keyword: value }))
        }
        placeholder={t("searchSuppliers")}
        onSubmit={apply}
        onReset={reset}
      >
        <FilterSelect
          id="supplier-status"
          label={t("status")}
          value={draft.status}
          onChange={(value) =>
            setDraft((current) => ({ ...current, status: value }))
          }
        >
          <StatusOptions kind="supplier" />
        </FilterSelect>
      </FilterBar>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} />
      ) : (
        <>
          <ListRows
            rows={(page?.items ?? []).map((supplier) => ({
              id: supplier.id,
              title: supplier.name ?? "—",
              meta: `${supplier.email ?? "—"} · ${supplier.phone ?? "—"}`,
              status: supplier.status,
              href: supplier.id ? `/admin/suppliers/${supplier.id}` : undefined,
            }))}
          />
          <ListFooter
            page={page}
            onPrev={() =>
              setApplied((current) => ({
                ...current,
                cursor: page?.prevCursor,
              }))
            }
            onNext={() =>
              setApplied((current) => ({
                ...current,
                cursor: page?.nextCursor,
              }))
            }
          />
        </>
      )}
    </Shell>
  );
}

function Payments() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const methods = useAdminPaymentMethods();
  const [draft, setDraft] = useState({
    keyword: "",
    status: "",
    paymentMethodCode: "",
    fromDate: "",
    toDate: "",
  });
  const [applied, setApplied] = useState({
    ...draft,
    cursor: undefined as string | undefined,
  });
  const query = useAdminPayments({
    limit: 20,
    cursor: applied.cursor,
    keyword: applied.keyword || undefined,
    status: applied.status || undefined,
    paymentMethodCode: applied.paymentMethodCode || undefined,
    fromDate: dateParam(applied.fromDate, false),
    toDate: dateParam(applied.toDate, true),
  });
  const mutation = useAdminPaymentStatus();
  const apply = () =>
    setApplied({ ...draft, keyword: draft.keyword.trim(), cursor: undefined });
  const reset = () => {
    const empty = {
      keyword: "",
      status: "",
      paymentMethodCode: "",
      fromDate: "",
      toDate: "",
    };
    setDraft(empty);
    setApplied({ ...empty, cursor: undefined });
  };
  const page = query.data;
  return (
    <Shell
      title={t("resource.payments")}
      description={t("resource.paymentsDescription")}
    >
      <FilterBar
        value={draft.keyword}
        onChange={(value) =>
          setDraft((current) => ({ ...current, keyword: value }))
        }
        placeholder={t("searchPayments")}
        onSubmit={apply}
        onReset={reset}
      >
        <FilterSelect
          id="payment-status"
          label={t("status")}
          value={draft.status}
          onChange={(value) =>
            setDraft((current) => ({ ...current, status: value }))
          }
        >
          <StatusOptions kind="payment" />
        </FilterSelect>
        <FilterSelect
          id="payment-method-filter"
          label={t("paymentMethod")}
          value={draft.paymentMethodCode}
          onChange={(value) =>
            setDraft((current) => ({ ...current, paymentMethodCode: value }))
          }
        >
          <option value="">{t("allPaymentMethods")}</option>
          {(methods.data ?? []).map((method) => (
            <option key={method.code ?? method.id} value={method.code}>
              {method.code} · {method.name}
            </option>
          ))}
        </FilterSelect>
        <DateFilter
          id="payment-from"
          label={t("fromDate")}
          value={draft.fromDate}
          onChange={(value) =>
            setDraft((current) => ({ ...current, fromDate: value }))
          }
        />
        <DateFilter
          id="payment-to"
          label={t("toDate")}
          value={draft.toDate}
          onChange={(value) =>
            setDraft((current) => ({ ...current, toDate: value }))
          }
        />
      </FilterBar>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} />
      ) : (
        <>
          {(page?.items ?? []).length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {(page?.items ?? []).map((payment, index) => (
                <PaymentRow
                  key={payment.id ?? index}
                  payment={payment}
                  locale={locale}
                  mutation={mutation}
                />
              ))}
            </div>
          )}
          <ListFooter
            page={page}
            onPrev={() =>
              setApplied((current) => ({
                ...current,
                cursor: page?.prevCursor,
              }))
            }
            onNext={() =>
              setApplied((current) => ({
                ...current,
                cursor: page?.nextCursor,
              }))
            }
          />
        </>
      )}
      {mutation.isError ? (
        <div className="mt-4">
          <Failure error={mutation.error} />
        </div>
      ) : null}
    </Shell>
  );
}

function PaymentRow({
  payment,
  locale,
  mutation,
}: {
  payment: PaymentDetail;
  locale: string;
  mutation: ReturnType<typeof useAdminPaymentStatus>;
}) {
  const t = useTranslations("admin");
  const [expanded, setExpanded] = useState(false);
  const [providerCode, setProviderCode] = useState(
    payment.providerTransactionCode ?? "",
  );
  return (
    <Card className="transition hover:border-primary/30 hover:shadow-md">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {payment.providerTransactionCode ?? shortId(payment.id)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {payment.paymentMethodCode ?? "—"} ·{" "}
              {payment.orderId ? (
                <Link
                  href={`/admin/orders/${payment.orderId}`}
                  className="hover:text-primary hover:underline"
                >
                  {shortId(payment.orderId)}
                </Link>
              ) : (
                "—"
              )}
            </p>
            <p className="mt-1 font-medium">
              {formatMoney(payment.amount, locale)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={payment.status} />
            <Select
              className="h-9 w-32"
              value={payment.status ?? ""}
              onChange={(event) =>
                void mutation.mutateAsync({
                  id: payment.id ?? "",
                  status: event.target.value,
                  providerTransactionCode: providerCode.trim() || undefined,
                })
              }
              disabled={
                !payment.id ||
                mutation.isPending ||
                payment.status !== PaymentStatus.Pending
              }
            >
              {paymentStatusOptions(payment.status).map((status) => (
                <option key={status} value={status}>
                  {t.has(`statusValues.${status}`)
                    ? t(`statusValues.${status}`)
                    : status}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? t("close") : t("edit")}
            </Button>
          </div>
        </div>
        {expanded ? (
          <div className="flex flex-wrap items-end gap-3 border-t pt-3">
            <label className="block w-full max-w-md space-y-1.5 text-sm">
              <span className="font-medium text-muted-foreground">
                {t("providerTransactionCode")}
              </span>
              <Input
                value={providerCode}
                onChange={(event) => setProviderCode(event.target.value)}
              />
            </label>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                void mutation.mutateAsync({
                  id: payment.id ?? "",
                  status: payment.status ?? PaymentStatus.Pending,
                  providerTransactionCode: providerCode.trim() || undefined,
                })
              }
              disabled={!payment.id || mutation.isPending}
            >
              {t("save")}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PaymentMethods() {
  const t = useTranslations("admin");
  const query = useAdminPaymentMethods();
  return (
    <Shell
      title={t("resource.paymentMethods")}
      description={t("resource.paymentMethodsDescription")}
    >
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(query.data ?? []).map((method, index) => (
            <Card
              key={method.id ?? index}
              className="transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <CardContent className="flex items-start gap-4 p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CreditCard className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {method.name ?? method.code ?? "—"}
                    </p>
                    <StatusBadge status={method.status} />
                  </div>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {method.code ?? "—"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("paymentMethodCatalogHint")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Reviews() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [draft, setDraft] = useState({ keyword: "", status: "", rating: "" });
  const [applied, setApplied] = useState({
    ...draft,
    cursor: undefined as string | undefined,
  });
  const query = useAdminReviews({
    limit: 20,
    cursor: applied.cursor,
    keyword: applied.keyword || undefined,
    status: applied.status || undefined,
    rating: toNumber(applied.rating),
  });
  const mutation = useAdminReviewStatus();
  const apply = () =>
    setApplied({ ...draft, keyword: draft.keyword.trim(), cursor: undefined });
  const reset = () => {
    const empty = { keyword: "", status: "", rating: "" };
    setDraft(empty);
    setApplied({ ...empty, cursor: undefined });
  };
  const page = query.data;
  return (
    <Shell
      title={t("resource.reviews")}
      description={t("resource.reviewsDescription")}
    >
      <FilterBar
        value={draft.keyword}
        onChange={(value) =>
          setDraft((current) => ({ ...current, keyword: value }))
        }
        placeholder={t("searchReviews")}
        onSubmit={apply}
        onReset={reset}
      >
        <FilterSelect
          id="review-status"
          label={t("status")}
          value={draft.status}
          onChange={(value) =>
            setDraft((current) => ({ ...current, status: value }))
          }
        >
          <StatusOptions kind="review" />
        </FilterSelect>
        <FilterSelect
          id="review-rating"
          label={t("rating")}
          value={draft.rating}
          onChange={(value) =>
            setDraft((current) => ({ ...current, rating: value }))
          }
        >
          <option value="">{t("allRatings")}</option>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating}/5
            </option>
          ))}
        </FilterSelect>
      </FilterBar>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} />
      ) : (
        <>
          {(page?.items ?? []).length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {(page?.items ?? []).map((review, index) => (
                <ReviewCard
                  key={review.id ?? index}
                  review={review}
                  locale={locale}
                  onStatus={(id, value) =>
                    mutation.mutateAsync({ id, status: value })
                  }
                />
              ))}
            </div>
          )}
          <ListFooter
            page={page}
            onPrev={() =>
              setApplied((current) => ({
                ...current,
                cursor: page?.prevCursor,
              }))
            }
            onNext={() =>
              setApplied((current) => ({
                ...current,
                cursor: page?.nextCursor,
              }))
            }
          />
        </>
      )}
      {mutation.isError ? (
        <div className="mt-4">
          <Failure error={mutation.error} />
        </div>
      ) : null}
    </Shell>
  );
}

function ReviewCard({
  review,
  locale,
  onStatus,
}: {
  review: Review;
  locale: string;
  onStatus: (id: string, status: string) => Promise<unknown> | unknown;
}) {
  const t = useTranslations("admin");
  const rating = Math.max(0, Math.min(5, review.rating ?? 0));
  return (
    <Card className="transition hover:border-primary/30 hover:shadow-md">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {review.productId ? (
                <Link
                  href={`/admin/products/${review.productId}`}
                  className="font-semibold hover:text-primary hover:underline"
                >
                  {review.productName ?? t("product")}
                </Link>
              ) : (
                <p className="font-semibold">
                  {review.productName ?? t("product")}
                </p>
              )}
              {review.isVerifiedPurchase ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {t("verifiedPurchase")}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {review.customerName ?? "—"}
              {review.createdAt
                ? ` · ${new Date(review.createdAt).toLocaleDateString(
                    locale === "vi" ? "vi-VN" : "en-US",
                  )}`
                : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={review.status} />
            {review.id ? (
              <StatusSelect
                currentStatus={review.status ?? ReviewStatus.Active}
                options={Object.values(ReviewStatus)}
                label={t("status")}
                onStatus={(status) => onStatus(review.id!, status)}
              />
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1" aria-label={`${rating}/5`}>
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={
                index < rating
                  ? "size-4 fill-amber-400 text-amber-400"
                  : "size-4 text-muted-foreground/30"
              }
            />
          ))}
          <span className="ml-1 text-sm font-medium">{rating}/5</span>
        </div>
        <p className="whitespace-pre-wrap rounded-xl bg-muted/35 p-4 text-sm leading-6">
          {review.comment || t("noReviewComment")}
        </p>
      </CardContent>
    </Card>
  );
}

function ListRows({
  rows,
  onStatus,
  kind,
  review,
}: {
  rows: {
    id?: string;
    title: string;
    meta: string;
    status?: string;
    href?: string;
  }[];
  onStatus?: (id: string, status: string) => Promise<unknown> | unknown;
  kind?: "account" | "review";
  review?: boolean;
}) {
  const t = useTranslations("admin");
  if (rows.length === 0) return <EmptyState />;
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <Card
          key={row.id ?? index}
          className="transition hover:border-primary/30 hover:shadow-md"
        >
          <CardContent className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
            <div className="min-w-0 flex-1">
              {row.href ? (
                <Link
                  href={row.href}
                  className="font-semibold hover:text-primary hover:underline"
                >
                  {row.title}
                </Link>
              ) : (
                <p className="font-semibold">{row.title}</p>
              )}
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {row.meta}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {row.href ? (
                <Link
                  href={row.href}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <Eye className="size-3.5" />
                  <span className="hidden sm:inline">{t("view")}</span>
                </Link>
              ) : null}
              <StatusBadge status={row.status} />
              {onStatus && row.id ? (
                <StatusSelect
                  currentStatus={row.status}
                  options={[
                    ResourceStatus.Active,
                    ResourceStatus.Inactive,
                    ...(kind === "account" ? [AccountStatus.Locked] : []),
                    ...(review ? [ReviewStatus.Deleted] : []),
                  ]}
                  label={t("status")}
                  onStatus={(status) => onStatus(row.id!, status)}
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListFooter({
  page,
  onPrev,
  onNext,
}: {
  page?: CursorPage;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!page || (!page.hasPrev && !page.hasNext)) return null;
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <PageSummary page={page} />
      <AdminPagination
        hasPrev={Boolean(page.hasPrev)}
        hasNext={Boolean(page.hasNext)}
        onPrev={onPrev}
        onNext={onNext}
      />
    </div>
  );
}

function flattenCategories(
  categories: CategoryTree[],
  depth = 0,
): { id: string; label: string }[] {
  return categories.flatMap((category) => [
    ...(category.id
      ? [
          {
            id: category.id,
            label: `${"— ".repeat(depth)}${category.name ?? ""}`,
          },
        ]
      : []),
    ...flattenCategories(category.children ?? [], depth + 1),
  ]);
}

function toNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function dateParam(value: string, endOfDay: boolean) {
  if (!value) return undefined;
  return `${value}T${endOfDay ? "23:59:59" : "00:00:00"}Z`;
}

function shortId(value?: string) {
  if (!value) return "—";
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}
