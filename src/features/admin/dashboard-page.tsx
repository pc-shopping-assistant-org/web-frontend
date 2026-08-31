"use client";

import {Activity, DollarSign, ShoppingBag, Users} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {StatusBadge} from "@/components/ui/status-badge";
import {formatMoney} from "@/lib/format";

import {useDashboardOverview, useOrderStatusStats, useRevenueChart, useTopSelling} from "./queries";

export function AdminDashboardPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const overview = useDashboardOverview();
  const stats = useOrderStatusStats();
  const revenue = useRevenueChart({period: "MONTH"});
  const topSelling = useTopSelling(5);
  if (overview.isPending) return <div className="space-y-6"><div className="h-16 animate-pulse rounded-xl bg-muted" /><div className="grid gap-4 md:grid-cols-4">{Array.from({length: 4}, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div></div>;
  if (overview.isError) return <ErrorMessage error={overview.error} />;
  const data = overview.data;
  const cards = [{label: t("totalRevenue"), value: formatMoney(data?.totalRevenue, locale), icon: DollarSign}, {label: t("totalOrders"), value: String(data?.totalOrders ?? 0), icon: ShoppingBag}, {label: t("completedOrders"), value: String(data?.completedOrders ?? 0), icon: Activity}, {label: t("totalCustomers"), value: String(data?.totalCustomers ?? 0), icon: Users}];
  return <div className="space-y-8"><div><p className="eyebrow">{t("dashboard")}</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">{t("dashboardTitle")}</h1><p className="mt-2 text-muted-foreground">{t("dashboardDescription")}</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(({label, value, icon: Icon}) => <Card key={label}><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div><Icon className="size-5 text-primary" /></CardContent></Card>)}</div><div className="grid gap-6 xl:grid-cols-2"><Card><CardHeader><CardTitle>{t("orderStatusStats")}</CardTitle></CardHeader><CardContent>{stats.isError ? <ErrorMessage error={stats.error} /> : stats.isPending ? <div className="h-20 animate-pulse rounded-xl bg-muted" /> : <div className="grid gap-3 sm:grid-cols-2">{(stats.data ?? []).map((item) => <div key={item.status} className="flex items-center justify-between rounded-xl border p-4"><StatusBadge status={item.status} /><span className="text-sm text-muted-foreground">{item.count ?? 0} · {item.percentage?.toFixed(1) ?? 0}%</span></div>)}</div>}</CardContent></Card><Card><CardHeader><CardTitle>{t("revenueChart")}</CardTitle></CardHeader><CardContent>{revenue.isError ? <ErrorMessage error={revenue.error} /> : revenue.isPending ? <div className="h-20 animate-pulse rounded-xl bg-muted" /> : <div className="space-y-3"><div className="flex flex-wrap gap-5 text-sm"><span>{t("chartRevenue")}: <strong>{formatMoney(revenue.data?.totalRevenue, locale)}</strong></span><span>{t("chartOrders")}: <strong>{revenue.data?.totalOrders ?? 0}</strong></span></div><div className="grid max-h-52 gap-2 overflow-auto">{(revenue.data?.dataPoints ?? []).slice(-12).map((point) => <div key={point.dateLabel} className="flex items-center gap-3 text-xs"><span className="w-20 text-muted-foreground">{point.dateLabel}</span><div className="h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{width: `${Math.min(100, ((point.revenue ?? 0) / Math.max(1, revenue.data?.totalRevenue ?? 1)) * 100 * 12)}%`}} /></div><span className="w-24 text-right">{formatMoney(point.revenue, locale)}</span></div>)}</div></div>}</CardContent></Card></div><Card><CardHeader><CardTitle>{t("topSelling")}</CardTitle></CardHeader><CardContent>{topSelling.isError ? <ErrorMessage error={topSelling.error} /> : topSelling.isPending ? <div className="h-20 animate-pulse rounded-xl bg-muted" /> : <div className="grid gap-3 md:grid-cols-2">{(topSelling.data ?? []).map((item, index) => <div key={item.productId ?? index} className="flex items-center justify-between rounded-xl border p-4 text-sm"><span className="font-medium">{item.productName ?? "—"}</span><span className="text-muted-foreground">{item.totalQuantitySold ?? 0} · {formatMoney(item.totalRevenue, locale)}</span></div>)}</div>}</CardContent></Card></div>;
}
