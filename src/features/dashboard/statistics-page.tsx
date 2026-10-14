"use client";

import {BarChart3, Package} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusBadge} from "@/components/ui/status-badge";
import {ORDER_STATUS_VALUES} from "@/lib/domain/commerce-enums";
import {formatMoney} from "@/lib/format";

import {AdminOnly} from "./admin-only";
import type {RevenueGranularity} from "./models";
import {useOrderStatusCounts, useRevenue, useTopVariants} from "./queries";
import {daysBefore, rangeProblem, shopDay} from "./shop-dates";

const DEFAULT_RANGE_DAYS = 30;
const TOP_LIMITS = [5, 10, 20, 50] as const;
const DEFAULT_TOP_LIMIT = 10;

function defaultRange() {
  const today = shopDay();
  return {from: daysBefore(today, DEFAULT_RANGE_DAYS - 1), to: today};
}

/** The sales report of the admin: revenue over a range of days, the best sellers and the orders by status. */
export function StatisticsPage() {
  return <AdminOnly><Statistics /></AdminOnly>;
}

function Statistics() {
  const t = useTranslations("dashboard.statistics");
  const [draft, setDraft] = useState(defaultRange);
  const [draftGranularity, setDraftGranularity] = useState<RevenueGranularity>("DAY");
  const [applied, setApplied] = useState(draft);
  const [granularity, setGranularity] = useState<RevenueGranularity>("DAY");
  const [limit, setLimit] = useState<number>(DEFAULT_TOP_LIMIT);
  const [problem, setProblem] = useState<"order" | "tooLong" | "missing">();

  const apply = () => {
    if (!draft.from || !draft.to) return setProblem("missing");
    const found = rangeProblem(draft.from, draft.to, draftGranularity);
    setProblem(found);
    if (found) return;
    setApplied(draft);
    setGranularity(draftGranularity);
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-border/70 pb-6">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("description")}</p>
      </header>

      <Card>
        <CardContent className="space-y-3 p-5">
          <form
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              apply();
            }}
          >
            <label className="space-y-1.5 text-sm font-medium">
              {t("from")}
              <Input id="stat-from" type="date" value={draft.from} aria-invalid={problem ? true : undefined} onChange={(event) => setDraft((current) => ({...current, from: event.target.value}))} />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              {t("to")}
              <Input id="stat-to" type="date" value={draft.to} aria-invalid={problem ? true : undefined} onChange={(event) => setDraft((current) => ({...current, to: event.target.value}))} />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              {t("granularity")}
              <Select id="stat-granularity" value={draftGranularity} onChange={(event) => setDraftGranularity(event.target.value as RevenueGranularity)}>
                <option value="DAY">{t("byDay")}</option>
                <option value="MONTH">{t("byMonth")}</option>
              </Select>
            </label>
            <Button type="submit" className="self-end">{t("apply")}</Button>
          </form>
          {problem ? <p role="alert" className="text-sm text-destructive">{t(`problem.${problem}`)}</p> : null}
        </CardContent>
      </Card>

      <RevenueCard range={applied} granularity={granularity} />
      <div className="grid gap-6 xl:grid-cols-2">
        <TopVariantsCard range={applied} limit={limit} onLimit={setLimit} />
        <OrderStatusCard range={applied} />
      </div>
    </div>
  );
}

function RevenueCard({range, granularity}: {range: {from: string; to: string}; granularity: RevenueGranularity}) {
  const t = useTranslations("dashboard.statistics");
  const locale = useLocale();
  const query = useRevenue(range, granularity);
  const points = query.data ?? [];
  const total = points.reduce((sum, point) => sum + point.revenue, 0);
  const orders = points.reduce((sum, point) => sum + point.orderCount, 0);
  const max = Math.max(1, ...points.map((point) => point.revenue));
  const label = (period: string) => granularity === "MONTH" ? period.slice(0, 7) : period.slice(5);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>{t("revenue.title")}</CardTitle>
          <CardDescription>{t(granularity === "MONTH" ? "revenue.monthly" : "revenue.daily")}</CardDescription>
        </div>
        <div className="rounded-xl bg-muted px-3 py-2 text-right">
          <p className="text-xs text-muted-foreground">{t("revenue.total", {orders})}</p>
          <p className="font-semibold">{formatMoney(total, locale)}</p>
        </div>
      </CardHeader>
      <CardContent>
        {query.isError ? (
          <ErrorMessage error={query.error} />
        ) : query.isPending ? (
          <Skeleton className="h-56 rounded-xl" />
        ) : total === 0 && orders === 0 ? (
          <Empty icon={BarChart3} title={t("revenue.empty")} description={t("revenue.emptyDescription")} />
        ) : (
          <div className="overflow-x-auto">
            <div className="flex h-56 items-end gap-1.5 rounded-2xl bg-muted/35 px-3 pb-3 pt-5" style={{minWidth: `${points.length * 28}px`}} aria-label={t("revenue.title")}>
              {points.map((point) => (
                <div
                  key={point.period}
                  className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  title={`${point.period}: ${formatMoney(point.revenue, locale)} · ${t("revenue.orders", {count: point.orderCount})}`}
                >
                  <div
                    className="w-full max-w-10 rounded-t-lg bg-primary/75 transition group-hover:bg-primary"
                    style={{height: `${point.revenue === 0 ? 3 : Math.max(8, (point.revenue / max) * 100)}%`}}
                  />
                  <span className="w-full truncate text-center text-[0.65rem] text-muted-foreground">{label(point.period)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TopVariantsCard({range, limit, onLimit}: {range: {from: string; to: string}; limit: number; onLimit: (limit: number) => void}) {
  const t = useTranslations("dashboard.statistics");
  const locale = useLocale();
  const query = useTopVariants(range, limit);
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>{t("top.title")}</CardTitle>
          <CardDescription>{t("top.description")}</CardDescription>
        </div>
        <Select className="h-9 w-28" value={limit} aria-label={t("top.limit")} onChange={(event) => onLimit(Number(event.target.value))}>
          {TOP_LIMITS.map((value) => <option key={value} value={value}>{t("top.limitOption", {count: value})}</option>)}
        </Select>
      </CardHeader>
      <CardContent>
        {query.isError ? (
          <ErrorMessage error={query.error} />
        ) : query.isPending ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : query.data.length === 0 ? (
          <Empty icon={Package} title={t("top.empty")} description={t("top.emptyDescription")} />
        ) : (
          <ol className="divide-y">
            {query.data.map((item, index) => (
              <li key={item.productVariantId} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.productName}</p>
                    <p className="truncate text-xs text-muted-foreground">{[item.sku, item.variantLabel].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">{formatMoney(item.revenue, locale)}</p>
                  <p className="text-xs text-muted-foreground">{t("top.sold", {count: item.quantitySold})}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function OrderStatusCard({range}: {range: {from: string; to: string}}) {
  const t = useTranslations("dashboard.statistics");
  const query = useOrderStatusCounts(range);
  const counts = query.data ?? {};
  const total = ORDER_STATUS_VALUES.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("status.title")}</CardTitle>
        <CardDescription>{t("status.description", {from: range.from, to: range.to})}</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isError ? (
          <ErrorMessage error={query.error} />
        ) : query.isPending ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : total === 0 ? (
          <Empty icon={BarChart3} title={t("status.empty")} description={t("status.emptyDescription")} />
        ) : (
          <div className="space-y-4">
            {ORDER_STATUS_VALUES.map((status) => {
              const count = counts[status] ?? 0;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge status={status} />
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{width: `${(count / total) * 100}%`}} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Empty({icon: Icon, title, description}: {icon: typeof BarChart3; title: string; description: string}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
      <Icon className="size-7 text-muted-foreground/60" />
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}
