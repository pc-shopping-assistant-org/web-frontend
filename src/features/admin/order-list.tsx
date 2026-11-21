"use client";

import {CheckCircle2, Clock, Download, ExternalLink, RefreshCw, Truck, Wallet} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useSearchParams} from "next/navigation";
import {useMemo, useState} from "react";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusBadge} from "@/components/ui/status-badge";
import {AdminOrderStatusControl} from "@/features/orders/admin-order-status";
import {useAdminOrders} from "@/features/orders/queries";
import {Link} from "@/i18n/navigation";
import {ORDER_STATUS_TRANSITIONS, OrderStatus} from "@/lib/domain/commerce-enums";
import {formatMoney} from "@/lib/format";
import {cn} from "@/lib/utils";

import {AdminPagination} from "./admin-pagination";
import {DataTable, EmptyBox, FilterField, FilterPanel, ListFooter, PageHeader, StatusTabs, dateParam} from "./list-kit";

const PAGE_SIZE = 20;
const ORDER_STATUSES = Object.values(OrderStatus) as string[];
const EMPTY_FILTERS = {keyword: "", fromDate: "", toDate: ""};

/**
 * Operational Admin Order Management (Option A: Overview KPI + Filter + Data Table)
 * Provides shop operators with at-a-glance throughput metrics, rapid status transitions,
 * date/keyword search, and full pagination.
 */
export function OrderListPage() {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.orderList");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const requested = searchParams.get("status") ?? "";

  const [status, setStatus] = useState(ORDER_STATUSES.includes(requested) ? requested : "");
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [pageNumber, setPageNumber] = useState(0);
  const [actionError, setActionError] = useState<unknown>(null);
  const [rangeError, setRangeError] = useState(false);

  const query = useAdminOrders({
    page: pageNumber,
    size: PAGE_SIZE,
    keyword: applied.keyword || undefined,
    status: status || undefined,
    createdFrom: dateParam(applied.fromDate, false),
    createdTo: dateParam(applied.toDate, true),
  });

  const page = query.data;
  const items = page?.items ?? [];
  const filtered = Boolean(status || applied.keyword || applied.fromDate || applied.toDate);
  const dateTime = useMemo(
    () => new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {dateStyle: "short", timeStyle: "short"}),
    [locale],
  );

  // Operational KPI calculations across current dataset
  const kpis = useMemo(() => {
    let pendingCount = 0;
    let shippingCount = 0;
    let completedCount = 0;
    let totalRevenue = 0;

    for (const order of items) {
      if (order.status === OrderStatus.PendingConfirmation || order.status === OrderStatus.PendingPayment) {
        pendingCount += 1;
      } else if (order.status === OrderStatus.Shipping) {
        shippingCount += 1;
      } else if (order.status === OrderStatus.Completed) {
        completedCount += 1;
        totalRevenue += order.totalAmount || 0;
      }
    }

    return {pendingCount, shippingCount, completedCount, totalRevenue};
  }, [items]);

  const set = (key: keyof typeof EMPTY_FILTERS, value: string) => setDraft((current) => ({...current, [key]: value}));

  const search = () => {
    if (draft.fromDate && draft.toDate && draft.fromDate > draft.toDate) {
      setRangeError(true);
      return;
    }
    setRangeError(false);
    setApplied({...draft, keyword: draft.keyword.trim()});
    setPageNumber(0);
    setActionError(null);
  };

  const reset = () => {
    setRangeError(false);
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setStatus("");
    setPageNumber(0);
    setActionError(null);
  };

  const go = (next: number) => {
    setPageNumber(Math.max(0, next));
    setActionError(null);
  };

  const handleKpiFilter = (targetStatus: string) => {
    setStatus((prev) => (prev === targetStatus ? "" : targetStatus));
    setPageNumber(0);
    setActionError(null);
  };

  const exportCsv = () => {
    if (items.length === 0) return;
    const headers = [tl("order"), tl("customer"), tl("items"), tl("total"), t("status")];
    const rows = items.map((o) => [
      o.invoiceNumber,
      `"${(o.recipientName ?? "").replace(/"/g, '""')}"`,
      `"${(o.firstProductName ?? "").replace(/"/g, '""')}"`,
      o.totalAmount,
      o.status,
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header with title and operational actions */}
      <PageHeader
        title={t("resource.orders")}
        description={t("resource.ordersDescription")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              className="h-9 gap-1.5"
            >
              <RefreshCw className={cn("size-3.5", query.isFetching && "animate-spin")} />
              <span>{tl("refresh")}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={items.length === 0}
              className="h-9 gap-1.5"
            >
              <Download className="size-3.5" />
              <span>{tl("export")}</span>
            </Button>
          </div>
        }
      />

      {/* Operational KPI summary metrics strip */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* KPI 1: Pending Confirmation */}
        <button
          type="button"
          onClick={() => handleKpiFilter(OrderStatus.PendingConfirmation)}
          title={tl("filterHint")}
          className={cn(
            "flex flex-col justify-between rounded-2xl border p-4 sm:p-5 text-left transition",
            "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            status === OrderStatus.PendingConfirmation
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "bg-card text-card-foreground",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">{tl("kpiPending")}</span>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight">{kpis.pendingCount}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("statusValues.PENDING_CONFIRMATION")}</p>
          </div>
        </button>

        {/* KPI 2: In Transit / Shipping */}
        <button
          type="button"
          onClick={() => handleKpiFilter(OrderStatus.Shipping)}
          title={tl("filterHint")}
          className={cn(
            "flex flex-col justify-between rounded-2xl border p-4 sm:p-5 text-left transition",
            "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            status === OrderStatus.Shipping
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "bg-card text-card-foreground",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">{tl("kpiShipping")}</span>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Truck className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight">{kpis.shippingCount}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("statusValues.SHIPPING")}</p>
          </div>
        </button>

        {/* KPI 3: Completed */}
        <button
          type="button"
          onClick={() => handleKpiFilter(OrderStatus.Completed)}
          title={tl("filterHint")}
          className={cn(
            "flex flex-col justify-between rounded-2xl border p-4 sm:p-5 text-left transition",
            "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            status === OrderStatus.Completed
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "bg-card text-card-foreground",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">{tl("kpiCompleted")}</span>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight">{kpis.completedCount}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("statusValues.COMPLETED")}</p>
          </div>
        </button>

        {/* KPI 4: Completed Revenue */}
        <div className="flex flex-col justify-between rounded-2xl border bg-card p-4 sm:p-5 text-card-foreground">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">{tl("kpiRevenue")}</span>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold tracking-tight sm:text-2xl">{formatMoney(kpis.totalRevenue, locale)}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{tl("completedRecords", {count: kpis.completedCount})}</p>
          </div>
        </div>
      </div>

      {/* Horizontal Status Filter Tabs */}
      <StatusTabs
        label={t("orderStatus")}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPageNumber(0);
          setActionError(null);
        }}
        tabs={[{value: "", label: tl("all")}, ...ORDER_STATUSES.map((value) => ({value, label: t(`statusValues.${value}`)}))]}
      />

      {/* Search & Date Filter Panel */}
      <FilterPanel
        onSubmit={search}
        onReset={reset}
        error={rangeError ? tl("rangeError") : undefined}
        className="xl:grid-cols-[minmax(0,1fr)_12rem_12rem]"
      >
        <FilterField label={t("search")}>
          <Input
            aria-label={t("searchOrders")}
            placeholder={t("searchOrders")}
            value={draft.keyword}
            onChange={(event) => set("keyword", event.target.value)}
          />
        </FilterField>
        <FilterField label={t("fromDate")}>
          <Input type="date" value={draft.fromDate} onChange={(event) => set("fromDate", event.target.value)} />
        </FilterField>
        <FilterField label={t("toDate")}>
          <Input type="date" value={draft.toDate} onChange={(event) => set("toDate", event.target.value)} />
        </FilterField>
      </FilterPanel>

      {/* Orders Data Table Card */}
      <Card className="p-4 sm:p-5">
        {actionError ? (
          <div className="mb-4">
            <ErrorMessage error={actionError} />
          </div>
        ) : null}

        {query.isPending ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : query.isError ? (
          <ErrorMessage error={query.error} />
        ) : items.length === 0 ? (
          <EmptyBox>{filtered ? tl("emptyFiltered") : tl("empty")}</EmptyBox>
        ) : (
          <DataTable
            minWidth="60rem"
            columns={[
              {key: "order", label: tl("order")},
              {key: "customer", label: tl("customer")},
              {key: "items", label: tl("items")},
              {key: "total", label: tl("total"), className: "text-right"},
              {key: "status", label: t("status")},
              {key: "actions", label: tl("actions")},
            ]}
          >
            {items.map((order) => (
              <tr key={order.id} className="border-t align-top transition-colors hover:bg-muted/30">
                {/* Order Invoice Number and Date */}
                <td className="whitespace-nowrap px-4 py-3.5">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-foreground transition-colors hover:text-primary hover:underline"
                  >
                    {order.invoiceNumber}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground font-mono">
                    {order.createdAt ? dateTime.format(new Date(order.createdAt)) : "—"}
                  </p>
                </td>

                {/* Customer Information */}
                <td className="px-4 py-3.5">
                  <p className="font-medium text-foreground">{order.recipientName ?? t("guestCustomer")}</p>
                  {order.recipientPhone ? (
                    <p className="mt-0.5 text-xs text-muted-foreground font-mono">{order.recipientPhone}</p>
                  ) : null}
                </td>

                {/* Main Product and Item Count */}
                <td className="max-w-[16rem] px-4 py-3.5">
                  <p className="truncate font-medium text-foreground" title={order.firstProductName ?? "—"}>
                    {order.firstProductName ?? "—"}
                  </p>
                  {order.itemCount > 1 ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("moreItems", {count: order.itemCount - 1})}</p>
                  ) : null}
                </td>

                {/* Total Order Amount */}
                <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tracking-tight text-foreground">
                  {formatMoney(order.totalAmount, locale)}
                </td>

                {/* Order Status Badge */}
                <td className="whitespace-nowrap px-4 py-3.5">
                  <StatusBadge status={order.status} />
                </td>

                {/* Quick Status Control and View Action */}
                <td className="whitespace-nowrap px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <AdminOrderStatusControl
                      orderId={order.id}
                      status={order.status}
                      onError={setActionError}
                    />
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 hover:text-primary"
                    >
                      <span>{t("view")}</span>
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {/* List Pagination & Total Counter */}
        {page && items.length > 0 ? (
          <ListFooter
            summary={
              <>
                {t("totalOrders", {count: page.totalElements})}
                {page.totalPages > 1 ? ` · ${t("pageOf", {page: page.page + 1, total: page.totalPages})}` : ""}
              </>
            }
            pager={
              page.totalPages > 1 ? (
                <AdminPagination page={page.page} totalPages={page.totalPages} onPageChange={go} />
              ) : undefined
            }
          />
        ) : null}
      </Card>
    </div>
  );
}
