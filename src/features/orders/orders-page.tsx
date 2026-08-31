"use client";

import {ChevronLeft, ChevronRight, Search} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {StatusBadge} from "@/components/ui/status-badge";
import {Link} from "@/i18n/navigation";
import {formatMoney} from "@/lib/format";
import {useLocale} from "next-intl";

import {useOrders} from "./queries";

const statuses = ["", "PENDING_PAYMENT", "PENDING_CONFIRMATION", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];

export function OrdersPage() {
  const t = useTranslations("orders");
  const common = useTranslations("common");
  const locale = useLocale();
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState({limit: 10, keyword: undefined as string | undefined, status: undefined as string | undefined, cursor: undefined as string | undefined});
  const query = useOrders(filters);
  const orders = query.data?.items ?? [];
  return <section className="page-wrap py-12 sm:py-16"><div className="mb-10 space-y-3"><p className="eyebrow">{t("eyebrow")}</p><h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1><p className="text-muted-foreground">{t("description")}</p></div><div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row"><form className="flex flex-1 gap-2" onSubmit={(event) => {event.preventDefault(); setFilters((current) => ({...current, keyword: keyword.trim() || undefined, cursor: undefined}));}}><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={t("searchPlaceholder")} /><Button type="submit"><Search className="size-4" />{t("search")}</Button></form><Select className="sm:w-60" value={status} onChange={(event) => {setStatus(event.target.value); setFilters((current) => ({...current, status: event.target.value || undefined, cursor: undefined}));}}>{statuses.map((value) => <option key={value} value={value}>{value ? t(`status.${value}`) : t("allStatuses")}</option>)}</Select></div>{query.isPending ? <div className="h-64 animate-pulse rounded-2xl bg-muted" /> : query.isError ? <ErrorMessage error={query.error} /> : orders.length === 0 ? <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">{t("empty")}</div> : <div className="space-y-3">{orders.map((order, index) => <Card key={order.id ?? index}><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-semibold">{t("orderNumber")}: {order.id?.slice(0, 8).toUpperCase() ?? "—"}</p><p className="mt-1 text-sm text-muted-foreground">{order.orderTime ? new Date(order.orderTime).toLocaleString(locale === "vi" ? "vi-VN" : "en-US") : "—"}</p><p className="mt-1 text-sm text-muted-foreground">{order.items?.length ?? 0} {t("items")}</p></div><div className="flex items-center gap-4"><div className="text-right"><StatusBadge status={order.status} label={order.status ? t(`status.${order.status}`, {default: order.status}) : undefined} /><p className="mt-2 font-semibold">{formatMoney(order.totalAmount, locale)}</p></div>{order.id ? <Link href={`/orders/${order.id}`} className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted">{t("view")}</Link> : null}</div></CardContent></Card>)}</div>}{!query.isPending && !query.isError && (query.data?.hasPrev || query.data?.hasNext) ? <div className="mt-8 flex justify-center gap-2"><Button variant="outline" disabled={!query.data?.hasPrev || !query.data?.prevCursor} onClick={() => setFilters((current) => ({...current, cursor: query.data?.prevCursor}))}><ChevronLeft className="size-4" />{common("back")}</Button><Button variant="outline" disabled={!query.data?.hasNext || !query.data?.nextCursor} onClick={() => setFilters((current) => ({...current, cursor: query.data?.nextCursor}))}>{t("next")}<ChevronRight className="size-4" /></Button></div> : null}</section>;
}
