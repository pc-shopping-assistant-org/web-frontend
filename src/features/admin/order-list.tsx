"use client";

import {useLocale, useTranslations} from "next-intl";
import {useSearchParams} from "next/navigation";
import {useState} from "react";

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

import {AdminPagination} from "./admin-pagination";
import {DataTable, EmptyBox, FilterField, FilterPanel, ListFooter, PageHeader, StatusTabs, dateParam} from "./list-kit";

const PAGE_SIZE = 20;
const ORDER_STATUSES = Object.values(OrderStatus) as string[];
const EMPTY_FILTERS = {keyword: "", fromDate: "", toDate: ""};

/**
 * The orders of the shop: tabs by status, a search by order or customer and by day, and a table where each order
 * can be opened or moved on to its next valid status.
 */
export function OrderListPage() {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.orderList");
  const locale = useLocale();
  const requested = useSearchParams().get("status") ?? "";
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
  const dateTime = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {dateStyle: "short", timeStyle: "short"});
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

  return (
    <div className="space-y-5">
      <PageHeader title={t("resource.orders")} description={t("resource.ordersDescription")} />

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

      <FilterPanel
        onSubmit={search}
        onReset={reset}
        error={rangeError ? tl("rangeError") : undefined}
        className="xl:grid-cols-[minmax(0,1fr)_11rem_11rem]"
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
              <tr key={order.id} className="border-t align-top transition hover:bg-muted/20">
                <td className="whitespace-nowrap px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium hover:text-primary hover:underline">
                    {order.invoiceNumber}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {order.createdAt ? dateTime.format(new Date(order.createdAt)) : "—"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{order.recipientName ?? t("guestCustomer")}</p>
                  {order.recipientPhone ? <p className="mt-0.5 text-xs text-muted-foreground">{order.recipientPhone}</p> : null}
                </td>
                <td className="max-w-[16rem] px-4 py-3">
                  <p className="truncate">{order.firstProductName ?? "—"}</p>
                  {order.itemCount > 1 ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("moreItems", {count: order.itemCount - 1})}</p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{formatMoney(order.totalAmount, locale)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {(ORDER_STATUS_TRANSITIONS[order.status as OrderStatus]?.length ?? 0) > 1 ? (
                      <AdminOrderStatusControl orderId={order.id} status={order.status} onError={setActionError} className="h-9 w-44" />
                    ) : null}
                    <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium text-primary hover:underline">
                      {t("view")}
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
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
                <AdminPagination
                  hasPrev={page.page > 0}
                  hasNext={!page.last}
                  onPrev={() => go(pageNumber - 1)}
                  onNext={() => go(pageNumber + 1)}
                />
              ) : undefined
            }
          />
        ) : null}
      </Card>
    </div>
  );
}
