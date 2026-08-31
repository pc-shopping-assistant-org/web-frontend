"use client";

import {ArrowLeft, Check, Minus, Plus, ShoppingCart, Star} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useMemo, useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Link} from "@/i18n/navigation";
import {ApiClientError} from "@/lib/api/envelope";
import {formatMoney, formatRating} from "@/lib/format";

import {useAddToCart} from "@/features/cart/queries";
import {useProductBySlug, useProductReviews} from "../queries";

export function ProductDetailPage({slug}: {slug: string}) {
  const t = useTranslations("catalog");
  const common = useTranslations("common");
  const locale = useLocale();
  const query = useProductBySlug(slug);
  const product = query.data;
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const addMutation = useAddToCart();

  const variants = product?.variants ?? [];
  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0];
  const reviews = useProductReviews(product?.id ?? "");
  const images = useMemo(() => (selected?.images ?? []).filter((image) => image.status === "ACTIVE"), [selected]);
  const heroImage = images.find((image) => image.main)?.imageUrl ?? images[0]?.imageUrl ?? selected?.imageUrl ?? product?.imageUrl;

  if (query.isPending) return <section className="page-wrap py-16"><div className="h-[32rem] animate-pulse rounded-3xl bg-muted" /></section>;
  if (query.isError || !product) {
    return <section className="page-wrap py-16"><Link href="/products" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{common("back")}</Link><div className="rounded-2xl border border-dashed p-12 text-center"><h1 className="text-2xl font-semibold">{query.error instanceof ApiClientError && query.error.messageKey === "PRODUCT_NOT_FOUND" ? t("productNotFound") : t("loadError")}</h1><p className="mt-2 text-sm text-muted-foreground">{query.isError ? common("unknownError") : t("productNotFound")}</p></div></section>;
  }

  async function add() {
    if (!selected?.id || !selected.quantity || selected.quantity < 1) return;
    await addMutation.mutateAsync({productVariantId: selected.id, quantity});
  }

  return <section className="page-wrap py-12 sm:py-16">
    <Link href="/products" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{common("back")}</Link>
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-3">
        <div className="flex min-h-[26rem] items-center justify-center overflow-hidden rounded-3xl bg-muted/50 p-4">
          {heroImage ? <img src={heroImage} alt={product.name ?? ""} className="max-h-[28rem] w-full object-contain" /> : <span className="text-9xl font-semibold tracking-tighter text-foreground/10">{(product.name ?? "P").charAt(0).toUpperCase()}</span>}
        </div>
        {images.length > 1 ? <div className="grid grid-cols-5 gap-2">{images.map((image) => <div key={image.id} className="overflow-hidden rounded-xl border bg-muted/30 p-1"><img src={image.imageUrl} alt={image.name ?? product.name ?? ""} className="h-16 w-full object-cover" /></div>)}</div> : null}
      </div>
      <div className="space-y-6">
        <div className="space-y-3"><p className="eyebrow">{product.brand?.name ?? "PC"}</p><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{product.name}</h1><div className="flex items-center gap-2 text-sm text-muted-foreground"><Star className="size-4 fill-amber-400 text-amber-400" />{formatRating(product.ratingAverage)} · {product.reviewCount ?? 0} {t("reviews")}</div></div>
        <p className="leading-7 text-muted-foreground">{product.description ?? t("noDescription")}</p>
        <Card><CardHeader><CardTitle>{t("variants")}</CardTitle></CardHeader><CardContent className="space-y-3">{variants.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : variants.map((variant, index) => <button type="button" key={variant.id ?? index} className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-left transition ${selected?.id === variant.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`} onClick={() => {setSelectedId(variant.id); setQuantity(1);}}><div><p className="font-medium">{variant.model ?? variant.sku ?? `${t("variants")} ${index + 1}`}</p><p className="text-sm text-muted-foreground">{variant.options?.map((option) => option.value ?? option.name).filter(Boolean).join(" · ")}</p></div><div className="text-right"><p className="font-semibold">{formatMoney(variant.listPrice, locale)}</p><Badge className={variant.quantity && variant.quantity > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}>{variant.quantity && variant.quantity > 0 ? <><Check className="mr-1 size-3" />{t("inStock")}</> : t("outOfStock")}</Badge></div></button>)}</CardContent></Card>
        {selected ? <div className="rounded-2xl border bg-card p-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">{t("selectedVariant")}</p><p className="text-2xl font-semibold">{formatMoney(selected.listPrice, locale)}</p></div><div className="space-y-2"><Label htmlFor="quantity">{t("quantity")}</Label><div className="flex items-center gap-1"><Button type="button" size="icon" variant="outline" aria-label={t("decreaseQuantity")} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus className="size-4" /></Button><Input id="quantity" className="w-16 text-center" type="number" min={1} max={selected.quantity ?? 1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(Number(event.target.value) || 1, selected.quantity ?? 1)))} /><Button type="button" size="icon" variant="outline" aria-label={t("increaseQuantity")} onClick={() => setQuantity((value) => Math.min(selected.quantity ?? value + 1, value + 1))}><Plus className="size-4" /></Button></div></div></div>{addMutation.isError ? <div className="mt-4"><ErrorMessage error={addMutation.error} /></div> : null}{addMutation.isSuccess ? <p className="mt-4 text-sm text-emerald-700">{t("addedToCart")}</p> : null}<Button size="lg" className="mt-5 w-full" disabled={addMutation.isPending || !selected.quantity || selected.quantity < 1} onClick={() => void add()}><ShoppingCart className="size-4" />{addMutation.isPending ? common("loading") : t("addToCart")}</Button></div> : null}
      </div>
    </div>
    <section className="mt-14"><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow">{t("reviews")}</p><h2 className="mt-2 text-2xl font-semibold">{t("customerReviews")}</h2></div><span className="text-sm text-muted-foreground">{reviews.data?.size ?? 0}</span></div>{reviews.isPending ? <div className="h-24 animate-pulse rounded-2xl bg-muted" /> : reviews.isError ? <ErrorMessage error={reviews.error} /> : (reviews.data?.items ?? []).length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">{t("noReviews")}</div> : <div className="grid gap-4 md:grid-cols-2">{reviews.data?.items?.map((review) => <Card key={review.id}><CardContent className="space-y-2 p-5"><div className="flex items-center justify-between"><span className="font-medium">{review.customerName ?? t("verifiedBuyer")}</span><span className="flex items-center gap-1 text-sm"><Star className="size-4 fill-amber-400 text-amber-400" />{review.rating}/5</span></div><p className="text-sm leading-6 text-muted-foreground">{review.comment || "—"}</p></CardContent></Card>)}</div>}</section>
  </section>;
}
