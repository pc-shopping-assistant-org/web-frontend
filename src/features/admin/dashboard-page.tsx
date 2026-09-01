"use client";

import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  Building2,
  CircleDollarSign,
  CircleAlert,
  CheckCircle2,
  ChartNoAxesCombined,
  DollarSign,
  FilePlus2,
  FolderTree,
  Clock3,
  Package,
  SlidersHorizontal,
  ShoppingBag,
  Truck,
  Users,
  UserCog,
  MessageSquareQuote,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format";
import {AnalyticsPeriod} from "@/lib/domain/assistant-enums";
import {OrderStatus} from "@/lib/domain/commerce-enums";

import {
  useDashboardOverview,
  useOrderStatusStats,
  useRevenueChart,
  useTopSelling,
} from "./queries";

export function AdminDashboardPage({
  mode = "dashboard",
}: {
  mode?: "dashboard" | "statistics";
}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const isStatistics = mode === "statistics";
  const [period, setPeriod] = useState(AnalyticsPeriod.Month);
  const overview = useDashboardOverview();
  const stats = useOrderStatusStats();
  const revenue = useRevenueChart({ period });
  const topSelling = useTopSelling(5);

  if (overview.isPending) return <DashboardLoading />;
  if (overview.isError) return <ErrorMessage error={overview.error} />;

  const data = overview.data;
  const growth = data?.revenueGrowthRate;
  const cards = [
    {
      label: t("totalRevenue"),
      value: formatMoney(data?.totalRevenue, locale),
      detail:
        growth == null
          ? t("currentPeriod")
          : String(growth.toFixed(1)) + "% " + t("vsLastMonth"),
      icon: DollarSign,
      tone: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: t("totalOrders"),
      value: String(data?.totalOrders ?? 0),
      detail: t("currentPeriod"),
      icon: ShoppingBag,
      tone: "bg-blue-500/10 text-blue-600",
    },
    {
      label: t("completedOrders"),
      value: String(data?.completedOrders ?? 0),
      detail: String(data?.cancelledOrders ?? 0) + " " + t("cancelled"),
      icon: Activity,
      tone: "bg-violet-500/10 text-violet-600",
    },
    {
      label: t("totalCustomers"),
      value: String(data?.totalCustomers ?? 0),
      detail:
        "+" +
        String(data?.newCustomersThisMonth ?? 0) +
        " " +
        t("newThisMonth"),
      icon: Users,
      tone: "bg-amber-500/10 text-amber-600",
    },
  ] satisfies {
    label: string;
    value: string;
    detail: string;
    icon: LucideIcon;
    tone: string;
  }[];

  const statusItems = stats.data ?? [];
  const statusCounts = new Map(
    statusItems.map((item) => [item.status ?? "", item.count ?? 0]),
  );
  const revenuePoints = revenue.data?.dataPoints ?? [];
  const visibleRevenuePoints = revenuePoints.slice(-12);
  const hasRevenueActivity = visibleRevenuePoints.some(
    (point) => (point.revenue ?? 0) > 0 || (point.orderCount ?? 0) > 0,
  );
  const maxRevenue = Math.max(
    1,
    ...visibleRevenuePoints.map((point) => point.revenue ?? 0),
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">
            {t(isStatistics ? "nav.statistics" : "dashboard")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t(isStatistics ? "statisticsTitle" : "dashboardTitle")}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t(isStatistics ? "statisticsDescription" : "dashboardDescription")}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
        >
          {t("viewStore")}
          <ArrowUpRight className="size-4" />
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>{t("revenueChart")}</CardTitle>
              <CardDescription>{t("currentPeriod")}</CardDescription>
            </div>
            <Select
              className="h-9 w-32"
              value={period}
              onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}
              aria-label={t("reportingPeriod")}
            >
              <option value={AnalyticsPeriod.Week}>{t("week")}</option>
              <option value={AnalyticsPeriod.Month}>{t("month")}</option>
              <option value={AnalyticsPeriod.Year}>{t("year")}</option>
            </Select>
            <div className="rounded-xl bg-muted px-3 py-2 text-right">
              <p className="text-xs text-muted-foreground">
                {t("chartRevenue")}
              </p>
              <p className="font-semibold">
                {formatMoney(revenue.data?.totalRevenue, locale)}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {revenue.isError ? (
              <ErrorMessage error={revenue.error} />
            ) : revenue.isPending ? (
              <Skeleton className="h-52 rounded-xl" />
            ) : visibleRevenuePoints.length === 0 || !hasRevenueActivity ? (
              <EmptyState
                icon={ChartNoAxesCombined}
                title={t("noRevenueData")}
                description={t("noRevenueDescription")}
                href="/admin/orders"
                action={t("manageOrders")}
              />
            ) : (
              <div className="space-y-3">
                <div
                  className="flex h-52 items-end gap-2 rounded-2xl bg-muted/35 px-3 pb-3 pt-5"
                  aria-label={t("revenueChart")}
                >
                  {visibleRevenuePoints.map((point) => {
                    const amount = point.revenue ?? 0;
                    const height =
                      amount === 0
                        ? 5
                        : Math.max(10, (amount / maxRevenue) * 100);
                    return (
                      <div
                        key={point.dateLabel}
                        className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                        title={
                          (point.dateLabel ?? "") +
                          ": " +
                          formatMoney(amount, locale)
                        }
                      >
                        <div
                          className="w-full max-w-10 rounded-t-lg bg-primary/75 transition group-hover:bg-primary"
                          style={{ height: String(height) + "%" }}
                        />
                        <span className="w-full truncate text-center text-[0.68rem] text-muted-foreground">
                          {point.dateLabel ?? "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {t("chartOrders")}: {revenue.data?.totalOrders ?? 0}
                  </span>
                  <span>{t("last12Points")}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("orderStatusStats")}</CardTitle>
            <CardDescription>{t("statusBreakdownDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.isError ? (
              <ErrorMessage error={stats.error} />
            ) : stats.isPending ? (
              <Skeleton className="h-52 rounded-xl" />
            ) : statusItems.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {statusItems.map((item) => (
                  <Link
                    key={item.status}
                    href={
                      item.status
                        ? `/admin/orders?status=${encodeURIComponent(item.status)}`
                        : "/admin/orders"
                    }
                    className="group block space-y-2 rounded-xl p-1 -m-1 transition hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge status={item.status} />
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        {item.count ?? 0}
                        <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width:
                            String(
                              Math.min(100, Math.max(0, item.percentage ?? 0)),
                            ) + "%",
                        }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>{t("topSelling")}</CardTitle>
              <CardDescription>{t("topSellingDescription")}</CardDescription>
            </div>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("viewAll")}
              <ArrowUpRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {topSelling.isError ? (
              <ErrorMessage error={topSelling.error} />
            ) : topSelling.isPending ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : (topSelling.data ?? []).length === 0 ? (
              <EmptyState
                icon={Package}
                title={t("noTopSellingData")}
                description={t("noTopSellingDescription")}
                href="/admin/products"
                action={t("manageProducts")}
              />
            ) : (
              <div className="divide-y">
                {topSelling.data?.map((item, index) => (
                  <div
                    key={item.productId ?? index}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      {item.productId ? (
                        <Link
                          href={"/admin/products/" + item.productId}
                          className="truncate text-sm font-medium hover:text-primary hover:underline"
                        >
                          {item.productName ?? t("noData")}
                        </Link>
                      ) : (
                        <span className="truncate text-sm font-medium">
                          {item.productName ?? t("noData")}
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">
                        {formatMoney(item.totalRevenue, locale)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.totalQuantitySold ?? 0} {t("sold")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <OperationalQueue statusCounts={statusCounts} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("quickActions")}</CardTitle>
          <CardDescription>{t("quickActionsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            href="/admin/products"
            icon={Package}
            title={t("manageProducts")}
          />
          <QuickAction
            href="/admin/orders"
            icon={ShoppingBag}
            title={t("manageOrders")}
          />
          <QuickAction
            href="/admin/customers"
            icon={Users}
            title={t("manageCustomers")}
          />
          <QuickAction
            href="/admin/invoices"
            icon={FilePlus2}
            title={t("nav.invoices")}
          />
          <QuickAction
            href="/admin/categories"
            icon={FolderTree}
            title={t("nav.categories")}
          />
          <QuickAction
            href="/admin/brands"
            icon={Building2}
            title={t("nav.brands")}
          />
          <QuickAction
            href="/admin/discounts"
            icon={BadgePercent}
            title={t("nav.discounts")}
          />
          <QuickAction
            href="/admin/payments"
            icon={DollarSign}
            title={t("nav.payments")}
          />
          <QuickAction
            href="/admin/payment-methods"
            icon={CircleDollarSign}
            title={t("nav.paymentMethods")}
          />
          <QuickAction
            href="/admin/options"
            icon={SlidersHorizontal}
            title={t("manageCatalogSettings")}
          />
          <QuickAction
            href="/admin/employees"
            icon={UserCog}
            title={t("nav.employees")}
          />
          <QuickAction
            href="/admin/suppliers"
            icon={Truck}
            title={t("nav.suppliers")}
          />
          <QuickAction
            href="/admin/reviews"
            icon={MessageSquareQuote}
            title={t("nav.reviews")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function OperationalQueue({
  statusCounts,
}: {
  statusCounts: Map<string, number>;
}) {
  const t = useTranslations("admin");
  const items = [
    {
      status: OrderStatus.PendingPayment,
      icon: CircleAlert,
      tone: "text-amber-600 bg-amber-500/10",
    },
    {
      status: OrderStatus.PendingConfirmation,
      icon: Clock3,
      tone: "text-blue-600 bg-blue-500/10",
    },
    {
      status: OrderStatus.Shipping,
      icon: Truck,
      tone: "text-violet-600 bg-violet-500/10",
    },
  ];
  const total = items.reduce(
    (sum, item) => sum + (statusCounts.get(item.status) ?? 0),
    0,
  );
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>{t("pendingWork")}</CardTitle>
          <CardDescription>{t("pendingWorkDescription")}</CardDescription>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          {total}
        </span>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={t("noPendingWork")}
            description={t("noPendingWorkDescription")}
            href="/admin/orders"
            action={t("manageOrders")}
          />
        ) : (
          <div className="space-y-3">
            {items.map(({ status, icon: Icon, tone }) => {
              const count = statusCounts.get(status) ?? 0;
              return (
                <Link
                  key={status}
                  href={`/admin/orders?status=${status}`}
                  className="group flex items-center gap-3 rounded-xl border p-3 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <span
                    className={`flex size-9 items-center justify-center rounded-xl ${tone}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {t.has(`statusValues.${status}`)
                        ? t(`statusValues.${status}`)
                        : status}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {t("openOrders")}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {count}
                    <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {value}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
          </div>
          <span
            className={
              "flex size-10 shrink-0 items-center justify-center rounded-xl " +
              tone
            }
          >
            <Icon className="size-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
}: {
  href:
    | "/admin/products"
    | "/admin/orders"
    | "/admin/customers"
    | "/admin/invoices"
    | "/admin/categories"
    | "/admin/brands"
    | "/admin/discounts"
    | "/admin/payments"
    | "/admin/payment-methods"
    | "/admin/options"
    | "/admin/employees"
    | "/admin/suppliers"
    | "/admin/reviews";
  icon: LucideIcon;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border bg-muted/20 p-3.5 transition hover:border-primary/30 hover:bg-primary/5"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium">{title}</span>
      <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

function EmptyState({
  icon: Icon = Activity,
  title,
  description,
  href,
  action,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  href?: "/admin/products" | "/admin/orders";
  action?: string;
}) {
  const t = useTranslations("admin");
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
      <Icon className="size-7 text-muted-foreground/60" />
      <p className="mt-3 text-sm font-medium text-foreground">
        {title ?? t("noData")}
      </p>
      {description ? (
        <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {href && action ? (
        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {action}
          <ArrowUpRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            key={index}
            className="h-32 rounded-2xl"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
