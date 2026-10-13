"use client";

import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BadgePercent,
  Building2,
  CircleDollarSign,
  DollarSign,
  FilePlus2,
  FolderTree,
  MessageSquareQuote,
  Package,
  PackageX,
  ShoppingBag,
  SlidersHorizontal,
  TriangleAlert,
  Truck,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import type {ReactNode} from "react";

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusBadge} from "@/components/ui/status-badge";
import {useProfile} from "@/features/auth/queries";
import {Link} from "@/i18n/navigation";
import {isAdminRole, isEmployeeRole} from "@/lib/auth/roles";
import {ORDER_STATUS_VALUES} from "@/lib/domain/commerce-enums";
import {formatMoney} from "@/lib/format";

import {useCustomerSummary, useOrderDashboard, useStockSummary} from "./queries";

/** The overview: for the admin three parts, each from its own service, so one that is down leaves the others. */
export function DashboardPage() {
  const t = useTranslations("dashboard");
  const role = useProfile().data?.role;
  const admin = isAdminRole(role);
  return (
    <div className="space-y-8">
      <header className="border-b border-border/70 pb-6">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t(admin ? "description" : "employeeDescription")}</p>
      </header>
      {admin ? (
        <div className="space-y-8">
          <OrdersSection />
          <CustomersSection />
          <StockSection />
        </div>
      ) : null}
      <QuickActions admin={admin} employee={isEmployeeRole(role)} />
    </div>
  );
}

function OrdersSection() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const query = useOrderDashboard();
  return (
    <Section title={t("orders.title")} loading={query.isPending} error={query.isError ? query.error : undefined} tall>
      {query.data ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <Metric label={t("orders.revenueToday")} value={formatMoney(query.data.revenueToday, locale)} detail={t("orders.revenueNote")} icon={DollarSign} tone="bg-emerald-500/10 text-emerald-600" />
            <Metric label={t("orders.revenueThisMonth")} value={formatMoney(query.data.revenueThisMonth, locale)} detail={t("orders.revenueNote")} icon={CircleDollarSign} tone="bg-blue-500/10 text-blue-600" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t("orders.byStatus")}</CardTitle>
              <CardDescription>{t("orders.byStatusDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {ORDER_STATUS_VALUES.map((status) => (
                <Link
                  key={status}
                  href={`/admin/orders?status=${status}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border p-3 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <StatusBadge status={status} />
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {query.data.ordersByStatus[status] ?? 0}
                    <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </Section>
  );
}

function CustomersSection() {
  const t = useTranslations("dashboard");
  const query = useCustomerSummary();
  return (
    <Section title={t("customers.title")} loading={query.isPending} error={query.isError ? query.error : undefined}>
      {query.data ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label={t("customers.total")} value={String(query.data.totalCustomers)} icon={Users} tone="bg-amber-500/10 text-amber-600" />
          <Metric label={t("customers.newToday")} value={String(query.data.newToday)} icon={UserPlus} tone="bg-violet-500/10 text-violet-600" />
          <Metric label={t("customers.newThisMonth")} value={String(query.data.newThisMonth)} icon={UserPlus} tone="bg-violet-500/10 text-violet-600" />
        </div>
      ) : null}
    </Section>
  );
}

function StockSection() {
  const t = useTranslations("dashboard");
  const query = useStockSummary();
  return (
    <Section title={t("stock.title")} loading={query.isPending} error={query.isError ? query.error : undefined}>
      {query.data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric
            label={t("stock.low")}
            value={String(query.data.lowStockVariants)}
            detail={t("stock.lowDetail", {threshold: query.data.lowStockThreshold})}
            icon={TriangleAlert}
            tone="bg-amber-500/10 text-amber-600"
          />
          <Metric label={t("stock.out")} value={String(query.data.outOfStockVariants)} detail={t("stock.outDetail")} icon={PackageX} tone="bg-rose-500/10 text-rose-600" />
        </div>
      ) : null}
    </Section>
  );
}

/** One part of the page: its own title, its own loading, and its own error. */
function Section({title, loading, error, tall, children}: {title: string; loading: boolean; error?: unknown; tall?: boolean; children: ReactNode}) {
  return (
    <section className="space-y-3" aria-label={title}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {loading ? <Skeleton className={tall ? "h-64 rounded-2xl" : "h-32 rounded-2xl"} /> : error ? <ErrorMessage error={error} /> : children}
    </section>
  );
}

function Metric({label, value, detail, icon: Icon, tone}: {label: string; value: string; detail?: string; icon: LucideIcon; tone: string}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
            {detail ? <p className="mt-2 text-xs text-muted-foreground">{detail}</p> : null}
          </div>
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
            <Icon className="size-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions({admin, employee}: {admin: boolean; employee: boolean}) {
  const t = useTranslations("admin");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("quickActions")}</CardTitle>
        <CardDescription>{t("quickActionsDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {employee ? (
          <>
            <QuickAction href="/admin/products" icon={Package} title={t("manageProducts")} />
            <QuickAction href="/admin/orders" icon={ShoppingBag} title={t("manageOrders")} />
            <QuickAction href="/admin/customers" icon={Users} title={t("manageCustomers")} />
            <QuickAction href="/admin/invoices" icon={FilePlus2} title={t("nav.invoices")} />
            <QuickAction href="/admin/categories" icon={FolderTree} title={t("nav.categories")} />
            <QuickAction href="/admin/brands" icon={Building2} title={t("nav.brands")} />
            <QuickAction href="/admin/discounts" icon={BadgePercent} title={t("nav.discounts")} />
            <QuickAction href="/admin/payments" icon={DollarSign} title={t("nav.payments")} />
            <QuickAction href="/admin/payment-methods" icon={CircleDollarSign} title={t("nav.paymentMethods")} />
            <QuickAction href="/admin/options" icon={SlidersHorizontal} title={t("manageCatalogSettings")} />
            <QuickAction href="/admin/suppliers" icon={Truck} title={t("nav.suppliers")} />
            <QuickAction href="/admin/reviews" icon={MessageSquareQuote} title={t("nav.reviews")} />
          </>
        ) : null}
        {admin ? (
          <>
            <QuickAction href="/admin/statistics" icon={BarChart3} title={t("nav.statistics")} />
            <QuickAction href="/admin/employees" icon={UserCog} title={t("nav.employees")} />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function QuickAction({href, icon: Icon, title}: {
  href: "/admin/statistics" | "/admin/products" | "/admin/orders" | "/admin/customers" | "/admin/invoices" | "/admin/categories" | "/admin/brands" | "/admin/discounts" | "/admin/payments" | "/admin/payment-methods" | "/admin/options" | "/admin/employees" | "/admin/suppliers" | "/admin/reviews";
  icon: LucideIcon;
  title: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl border bg-muted/20 p-3.5 transition hover:border-primary/30 hover:bg-primary/5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium">{title}</span>
      <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
