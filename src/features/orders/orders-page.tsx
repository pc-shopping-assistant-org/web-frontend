"use client";

import {
  Ban,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Search,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api/envelope";
import { isStaffRole } from "@/lib/auth/roles";
import { formatMoney } from "@/lib/format";
import {OrderStatus} from "@/lib/domain/commerce-enums";

import { useProfile } from "@/features/auth/queries";
import { useCancelOrder, useOrders } from "./queries";

const statuses = ["", ...Object.values(OrderStatus)];

export function OrdersPage() {
  const t = useTranslations("orders");
  const nav = useTranslations("nav");
  const common = useTranslations("common");
  const locale = useLocale();
  const profile = useProfile();
  const isStaff = isStaffRole(profile.data?.role);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState({
    limit: 10,
    keyword: undefined as string | undefined,
    status: undefined as string | undefined,
    cursor: undefined as string | undefined,
  });
  const query = useOrders(filters, Boolean(profile.data) && !isStaff);
  const cancel = useCancelOrder();
  const orders = query.data?.items ?? [];
  const requiresLogin =
    profile.isError &&
    profile.error instanceof ApiClientError &&
    profile.error.status === 401;
  const hasFilters = Boolean(filters.keyword || filters.status);

  function applyFilters() {
    setFilters((current) => ({
      ...current,
      keyword: keyword.trim() || undefined,
      status: status || undefined,
      cursor: undefined,
    }));
  }

  function clearFilters() {
    setKeyword("");
    setStatus("");
    setFilters((current) => ({
      ...current,
      keyword: undefined,
      status: undefined,
      cursor: undefined,
    }));
  }

  if (profile.isPending) {
    return (
      <section className="page-wrap py-16">
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </section>
    );
  }

  if (profile.isError && !requiresLogin) {
    return (
      <section className="page-wrap py-16">
        <ErrorMessage error={profile.error} />
      </section>
    );
  }

  if (requiresLogin) {
    return (
      <section className="page-wrap py-16">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <KeyRound className="size-10 text-primary" />
            <h1 className="mt-4 text-2xl font-semibold">{nav("login")}</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {t("loginRequired")}
            </p>
            <Link
              href="/login?redirect=%2Forders"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85"
            >
              {nav("login")}
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (isStaff) {
    return (
      <section className="page-wrap py-16">
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <KeyRound className="size-10 text-primary" />
            <h1 className="mt-4 text-2xl font-semibold">{t("staffTitle")}</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              {t("staffDescription")}
            </p>
            <Link
              href="/admin/orders"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("openAdminOrders")}
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="page-wrap py-12 sm:py-16">
      <div className="mb-10 space-y-3">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="max-w-2xl text-muted-foreground">{t("description")}</p>
      </div>

      <div className="mb-6 rounded-2xl border bg-card p-4 shadow-sm">
        <form
          className="flex flex-col gap-3 lg:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
            />
          </div>
          <Select
            className="lg:w-64"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label={t("allStatuses")}
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value
                  ? t(`status.${value}`, { default: value })
                  : t("allStatuses")}
              </option>
            ))}
          </Select>
          <Button type="submit">
            <Search className="size-4" />
            {t("search")}
          </Button>
          {hasFilters ? (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              <X className="size-4" />
              {t("clearFilters")}
            </Button>
          ) : null}
        </form>
        {hasFilters ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("filteredResults")}
          </p>
        ) : null}
      </div>

      {query.isPending ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : null}
      {query.isError ? <ErrorMessage error={query.error} /> : null}
      {!query.isPending && !query.isError && orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          <p>{t("empty")}</p>
          {hasFilters ? (
            <Button className="mt-4" variant="outline" onClick={clearFilters}>
              {t("clearFilters")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {!query.isPending && !query.isError && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order, index) => (
            <Card
              key={order.id ?? index}
              className="transition hover:border-primary/30 hover:shadow-md"
            >
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {t("orderNumber")}: {order.id?.slice(0, 8).toUpperCase() ?? "—"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.orderTime
                      ? new Date(order.orderTime).toLocaleString(
                          locale === "vi" ? "vi-VN" : "en-US",
                        )
                      : "—"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.items?.length ?? 0} {t("items")}
                  </p>
                  {order.items?.length ? (
                    <p className="mt-1 max-w-[36rem] truncate text-sm font-medium text-foreground/80">
                      {order.items
                        .slice(0, 2)
                        .map((item) => item.productName ?? item.sku ?? "—")
                        .join(" · ")}
                      {order.items.length > 2 ? ` · +${order.items.length - 2}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <StatusBadge
                      status={order.status}
                      label={
                        order.status
                          ? t(`status.${order.status}`, {
                              default: order.status,
                            })
                          : undefined
                      }
                    />
                    <p className="mt-2 font-semibold">
                      {formatMoney(order.totalAmount, locale)}
                    </p>
                  </div>
                  {order.id ? (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                      >
                        {t("view")}
                      </Link>
                      {order.status === OrderStatus.PendingPayment || order.status === OrderStatus.PendingConfirmation ? (
                        <ConfirmAction
                          title={t("cancelOrder")}
                          description={t("cancelOrderDescription")}
                          confirmLabel={t("confirmCancel")}
                          cancelLabel={common("back")}
                          confirmVariant="destructive"
                          variant="outline"
                          size="sm"
                          onConfirm={() => cancel.mutateAsync({ orderId: order.id! })}
                          disabled={cancel.isPending}
                        >
                          <Ban className="size-4" />
                          <span className="hidden sm:inline">{t("cancel")}</span>
                        </ConfirmAction>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!query.isPending &&
      !query.isError &&
      (query.data?.hasPrev || query.data?.hasNext) ? (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={!query.data?.hasPrev || !query.data?.prevCursor}
            onClick={() =>
              setFilters((current) => ({
                ...current,
                cursor: query.data?.prevCursor,
              }))
            }
          >
            <ChevronLeft className="size-4" />
            {common("back")}
          </Button>
          <Button
            variant="outline"
            disabled={!query.data?.hasNext || !query.data?.nextCursor}
            onClick={() =>
              setFilters((current) => ({
                ...current,
                cursor: query.data?.nextCursor,
              }))
            }
          >
            {t("next")}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
