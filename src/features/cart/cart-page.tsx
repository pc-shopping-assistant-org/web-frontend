"use client";

import {Minus, Plus, ShoppingCart, Trash2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import Image from "next/image";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {ConfirmAction} from "@/components/ui/confirm-action";
import {Link} from "@/i18n/navigation";
import {ApiClientError} from "@/lib/api/envelope";
import {isStaffRole} from "@/lib/auth/roles";
import {formatMoney} from "@/lib/format";
import {useProfile} from "@/features/auth/queries";
import {CatalogCategoryIcon} from "@/features/catalog/components/catalog-category-icon";

import {useCart, useClearCart, useRemoveCartItem, useUpdateCartItem} from "./queries";

export function CartPage() {
  const t = useTranslations("cart");
  const common = useTranslations("common");
  const locale = useLocale();
  const profile = useProfile();
  const isStaff = isStaffRole(profile.data?.role);
  const requiresLogin = profile.isError && profile.error instanceof ApiClientError && profile.error.status === 401;
  const query = useCart(
    profile.isPending || requiresLogin || (profile.isSuccess && !isStaff),
  );
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const clear = useClearCart();
  const cart = query.data;
  const items = cart?.items ?? [];
  const mutationError = update.error ?? remove.error ?? clear.error;
  if (profile.isPending) return <section className="page-wrap py-16"><div className="h-72 animate-pulse rounded-2xl bg-muted" /></section>;
  if (profile.isError && !requiresLogin) return <section className="page-wrap py-16"><ErrorMessage error={profile.error} /></section>;
  if (isStaff) return <section className="page-wrap py-16"><Card className="border-primary/20 bg-primary/[0.03]"><CardContent className="flex flex-col items-center justify-center p-12 text-center"><ShoppingCart className="size-10 text-primary" /><h1 className="mt-4 text-2xl font-semibold">{t("staffTitle")}</h1><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t("staffDescription")}</p><Link href="/admin/orders" className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">{t("openAdminOrders")}</Link></CardContent></Card></section>;

  return <section className="page-wrap py-12 sm:py-16">
    <div className="mb-10 space-y-3"><p className="eyebrow">{t("totalItems")}</p><h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1><p className="text-muted-foreground">{t("description")}</p></div>
    {query.isPending ? <div className="h-72 animate-pulse rounded-2xl bg-muted" /> : null}
    {query.isError ? <div className="space-y-4"><ErrorMessage error={query.error} /><Button variant="outline" onClick={() => void query.refetch()}>{common("retry")}</Button></div> : null}
    {!query.isPending && !query.isError && items.length === 0 ? <div className="rounded-2xl border border-dashed p-16 text-center"><ShoppingCart className="mx-auto size-10 text-muted-foreground" /><p className="mt-4 font-medium">{t("empty")}</p><Link href="/products" className="mt-4 inline-block text-sm font-medium hover:underline">{t("browseCatalog")}</Link></div> : null}
    {!query.isPending && !query.isError && items.length > 0 ? <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>{items.length} · {t("totalItems")}</CardTitle><ConfirmAction title={t("confirmClearTitle")} description={t("confirmClearDescription")} confirmLabel={t("clear")} cancelLabel={common("back")} onConfirm={() => clear.mutateAsync()} variant="ghost" confirmVariant="destructive" size="sm">{t("clear")}</ConfirmAction></CardHeader><CardContent className="divide-y">{items.map((item, index) => <div key={item.productVariantId ?? index} className="flex gap-4 py-5 first:pt-0 last:pb-0"><div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/60">{item.imageUrl ? <Image src={item.imageUrl} alt={item.productName ?? ""} fill sizes="80px" unoptimized className="object-cover" /> : <CatalogCategoryIcon categoryName={item.productName ?? item.model} className="size-10 text-primary/35" strokeWidth={1.45} />}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><p className="font-medium">{item.productName ?? item.sku}</p><p className="text-sm text-muted-foreground">{item.model ?? item.sku}</p></div><p className="font-semibold">{formatMoney(item.subtotal, locale)}</p></div><div className="mt-4 flex items-center justify-between gap-3"><div className="flex items-center gap-1"><Button size="icon-sm" variant="outline" aria-label={t("decreaseQuantity")} disabled={(item.quantity ?? 1) <= 1 || update.isPending} onClick={() => item.productVariantId && void update.mutateAsync({variantId: item.productVariantId, quantity: Math.max(1, (item.quantity ?? 1) - 1)})}><Minus className="size-3" /></Button><Input aria-label={t("quantity")} className="h-8 w-14 text-center" type="number" min={1} max={item.stockQuantity ?? 1} value={item.quantity ?? 1} onChange={(event) => {if (item.productVariantId) void update.mutateAsync({variantId: item.productVariantId, quantity: Math.max(1, Math.min(Number(event.target.value) || 1, item.stockQuantity ?? 1))});}} /><Button size="icon-sm" variant="outline" aria-label={t("increaseQuantity")} disabled={update.isPending || (item.quantity ?? 0) >= (item.stockQuantity ?? Number.MAX_SAFE_INTEGER)} onClick={() => item.productVariantId && void update.mutateAsync({variantId: item.productVariantId, quantity: Math.min(item.stockQuantity ?? Number.MAX_SAFE_INTEGER, (item.quantity ?? 1) + 1)})}><Plus className="size-3" /></Button><span className="ml-2 text-xs text-muted-foreground">{t("stock", {count: item.stockQuantity ?? 0})}</span></div><ConfirmAction title={t("confirmRemoveTitle")} description={t("confirmRemoveDescription")} confirmLabel={t("remove")} cancelLabel={common("back")} onConfirm={() => item.productVariantId ? remove.mutateAsync(item.productVariantId) : undefined} variant="ghost" confirmVariant="destructive" size="sm" className="text-destructive hover:text-destructive" ariaLabel={t("remove")}><Trash2 className="size-4" />{t("remove")}</ConfirmAction></div></div></div>)}</CardContent></Card>
      <Card className="h-fit"><CardHeader><CardTitle>{t("subtotal")}</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{formatMoney(cart?.subtotalAmount, locale)}</p>{mutationError ? <div className="mt-4"><ErrorMessage error={mutationError} /></div> : null}{profile.isPending ? <div className="mt-6 h-10 animate-pulse rounded-lg bg-muted" /> : profile.isSuccess ? <Link href="/checkout" className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/85">{t("checkout")}</Link> : requiresLogin ? <Link href="/login?redirect=%2Fcheckout" className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10">{t("signInToCheckout")}</Link> : <div className="mt-6"><ErrorMessage error={profile.error} /></div>}</CardContent></Card>
    </div> : null}
  </section>;
}
