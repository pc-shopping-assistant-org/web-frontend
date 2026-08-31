"use client";

import {Minus, Plus, ShoppingCart, Trash2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Link} from "@/i18n/navigation";
import {formatMoney} from "@/lib/format";

import {useCart, useClearCart, useRemoveCartItem, useUpdateCartItem} from "./queries";

export function CartPage() {
  const t = useTranslations("cart");
  const common = useTranslations("common");
  const locale = useLocale();
  const query = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const clear = useClearCart();
  const cart = query.data;
  const items = cart?.items ?? [];
  const mutationError = update.error ?? remove.error ?? clear.error;

  return <section className="page-wrap py-12 sm:py-16">
    <div className="mb-10 space-y-3"><p className="eyebrow">{t("totalItems")}</p><h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1><p className="text-muted-foreground">{t("description")}</p></div>
    {query.isPending ? <div className="h-72 animate-pulse rounded-2xl bg-muted" /> : null}
    {query.isError ? <div className="space-y-4"><ErrorMessage error={query.error} /><Button variant="outline" onClick={() => void query.refetch()}>{common("retry")}</Button></div> : null}
    {!query.isPending && !query.isError && items.length === 0 ? <div className="rounded-2xl border border-dashed p-16 text-center"><ShoppingCart className="mx-auto size-10 text-muted-foreground" /><p className="mt-4 font-medium">{t("empty")}</p><Link href="/products" className="mt-4 inline-block text-sm font-medium hover:underline">{t("browseCatalog")}</Link></div> : null}
    {!query.isPending && !query.isError && items.length > 0 ? <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>{items.length} · {t("totalItems")}</CardTitle><Button variant="ghost" size="sm" onClick={() => void clear.mutateAsync()} disabled={clear.isPending}>{t("clear")}</Button></CardHeader><CardContent className="divide-y">{items.map((item, index) => <div key={item.productVariantId ?? index} className="flex gap-4 py-5 first:pt-0 last:pb-0"><div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/60">{item.imageUrl ? <img src={item.imageUrl} alt={item.productName ?? ""} className="h-full w-full object-cover" /> : <span className="text-2xl font-semibold text-muted-foreground/40">{(item.productName ?? "P").charAt(0)}</span>}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><p className="font-medium">{item.productName ?? item.sku}</p><p className="text-sm text-muted-foreground">{item.model ?? item.sku}</p></div><p className="font-semibold">{formatMoney(item.subtotal, locale)}</p></div><div className="mt-4 flex items-center justify-between gap-3"><div className="flex items-center gap-1"><Button size="icon-sm" variant="outline" aria-label={t("decreaseQuantity")} disabled={(item.quantity ?? 1) <= 1 || update.isPending} onClick={() => item.productVariantId && void update.mutateAsync({variantId: item.productVariantId, quantity: Math.max(1, (item.quantity ?? 1) - 1)})}><Minus className="size-3" /></Button><Input aria-label={t("quantity")} className="h-8 w-14 text-center" type="number" min={1} max={item.stockQuantity ?? 1} value={item.quantity ?? 1} onChange={(event) => {if (item.productVariantId) void update.mutateAsync({variantId: item.productVariantId, quantity: Math.max(1, Math.min(Number(event.target.value) || 1, item.stockQuantity ?? 1))});}} /><Button size="icon-sm" variant="outline" aria-label={t("increaseQuantity")} disabled={update.isPending || (item.quantity ?? 0) >= (item.stockQuantity ?? Number.MAX_SAFE_INTEGER)} onClick={() => item.productVariantId && void update.mutateAsync({variantId: item.productVariantId, quantity: Math.min(item.stockQuantity ?? Number.MAX_SAFE_INTEGER, (item.quantity ?? 1) + 1)})}><Plus className="size-3" /></Button><span className="ml-2 text-xs text-muted-foreground">{t("stock", {count: item.stockQuantity ?? 0})}</span></div><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => item.productVariantId && void remove.mutateAsync(item.productVariantId)} disabled={remove.isPending}><Trash2 className="size-4" />{t("remove")}</Button></div></div></div>)}</CardContent></Card>
      <Card className="h-fit"><CardHeader><CardTitle>{t("subtotal")}</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{formatMoney(cart?.subtotalAmount, locale)}</p>{mutationError ? <div className="mt-4"><ErrorMessage error={mutationError} /></div> : null}<Link href="/checkout" className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85">{t("checkout")}</Link></CardContent></Card>
    </div> : null}
  </section>;
}
