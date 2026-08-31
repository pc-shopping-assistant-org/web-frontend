"use client";

import {ShoppingCart} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ApiClientError} from "@/lib/api/envelope";
import {formatMoney} from "@/lib/format";

import {useCart} from "./queries";

export function CartPage() {
  const t = useTranslations("cart");
  const common = useTranslations("common");
  const locale = useLocale();
  const query = useCart();
  const cart = query.data;
  const items = cart?.items ?? [];

  return (
    <section className="page-wrap py-12 sm:py-16">
      <div className="mb-10 space-y-3"><p className="eyebrow">{t("totalItems")}</p><h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1><p className="text-muted-foreground">{t("description")}</p></div>
      {query.isPending ? <div className="h-72 animate-pulse rounded-2xl bg-muted" /> : null}
      {query.isError ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"><p>{t("loadError")}</p><p className="mt-2 text-sm text-muted-foreground">{query.error instanceof ApiClientError ? common("backendUnavailable") : common("unknownError")}</p><Button className="mt-5" variant="outline" onClick={() => void query.refetch()}>{common("retry")}</Button></div> : null}
      {!query.isPending && !query.isError && items.length === 0 ? <div className="rounded-2xl border border-dashed p-16 text-center"><ShoppingCart className="mx-auto size-10 text-muted-foreground" /><p className="mt-4 font-medium">{t("empty")}</p></div> : null}
      {!query.isPending && !query.isError && items.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Card><CardHeader><CardTitle>{items.length} · {t("totalItems")}</CardTitle></CardHeader><CardContent className="divide-y">{items.map((item, index) => <div key={item.productVariantId ?? index} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div><p className="font-medium">{item.productName ?? item.sku}</p><p className="text-sm text-muted-foreground">{item.quantity ?? 0} × {formatMoney(item.listPrice, locale)}</p></div><p className="font-semibold">{formatMoney(item.subtotal, locale)}</p></div>)}</CardContent></Card>
          <Card className="h-fit"><CardHeader><CardTitle>{t("subtotal")}</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{formatMoney(cart?.subtotalAmount, locale)}</p><Button className="mt-6 w-full" disabled>{t("checkout")}</Button></CardContent></Card>
        </div>
      ) : null}
    </section>
  );
}
