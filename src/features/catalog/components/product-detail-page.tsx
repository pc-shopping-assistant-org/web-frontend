"use client";

import {ArrowLeft, ArrowLeftRight, ChevronLeft, ChevronRight, Info, Minus, PackageCheck, Plus, ShoppingCart, ShieldCheck, Sparkles, Star, type LucideIcon} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import Image from "next/image";
import {useMemo, useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Link} from "@/i18n/navigation";
import {ApiClientError} from "@/lib/api/envelope";
import {formatMoney, formatRating} from "@/lib/format";
import {ApiMessageKey} from "@/lib/domain/message-keys";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

import {useAddToCart} from "@/features/cart/queries";
import {useProductBySlug, useProductRatingSummary, useProductReviews, useProducts} from "../queries";
import {CatalogCategoryIcon} from "./catalog-category-icon";
import {ProductCard} from "./product-card";
import {ProductIllustration, productArtKind} from "./product-card";

export function ProductDetailPage({slug}: {slug: string}) {
  const t = useTranslations("catalog");
  const common = useTranslations("common");
  const locale = useLocale();
  const query = useProductBySlug(slug);
  const product = query.data;
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>();
  const [reviewCursor, setReviewCursor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const addMutation = useAddToCart();
  const relatedQuery = useProducts(
    {categoryId: product?.category?.id, limit: 8},
    {enabled: Boolean(product?.category?.id)},
  );

  const variants = useMemo(
    () =>
      (product?.variants ?? []).filter(
        (variant) => !variant.status || variant.status === ResourceStatus.Active,
      ),
    [product?.variants],
  );
  const selected =
    variants.find((variant) => variant.id === selectedId) ?? variants[0];
  const reviews = useProductReviews(product?.id ?? "", reviewCursor);
  const ratingSummary = useProductRatingSummary(product?.id ?? "");
  const images = useMemo(
    () =>
      (selected?.images ?? []).filter(
        (image) => !image.status || image.status === ResourceStatus.Active,
      ),
    [selected],
  );
  const activeImage = images.find((image) => image.id === selectedImageId) ?? images.find((image) => image.main) ?? images[0];
  const heroImage = activeImage?.imageUrl ?? selected?.imageUrl ?? product?.imageUrl;
  const specifications = Object.entries(product?.specifications ?? {}).filter(([key, value]) => key.trim() && value !== null && value !== undefined);
  const categoryHref = product?.category?.id ? `/products?categoryId=${encodeURIComponent(product.category.id)}` : undefined;
  const assistantHref = product?.id ? `/assistant?mode=EVALUATE&productId=${encodeURIComponent(product.id)}` : undefined;
  const compareHref = product?.id ? `/assistant?mode=COMPARE&productIds=${encodeURIComponent(product.id)}` : undefined;

  if (query.isPending) return <section className="page-wrap py-16"><div className="h-[32rem] animate-pulse rounded-3xl bg-muted" /></section>;
  if (query.isError || !product) {
    return <section className="page-wrap py-16"><Link href="/products" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{common("back")}</Link><div className="rounded-2xl border border-dashed p-12 text-center"><h1 className="text-2xl font-semibold">{query.error instanceof ApiClientError && query.error.messageKey === ApiMessageKey.PRODUCT_NOT_FOUND ? t("productNotFound") : t("loadError")}</h1><p className="mt-2 text-sm text-muted-foreground">{query.isError ? common("unknownError") : t("productNotFound")}</p></div></section>;
  }

  async function add() {
    if (!selected?.id || !selected.quantity || selected.quantity < 1) return;
    await addMutation.mutateAsync({productVariantId: selected.id, quantity});
  }

  return <section className="page-wrap py-12 sm:py-16">
    <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Link href="/products" className="inline-flex items-center gap-2 hover:text-foreground"><ArrowLeft className="size-4" />{common("back")}</Link>
      {categoryHref ? <><span aria-hidden="true">/</span><Link href={categoryHref} className="hover:text-primary">{product.category?.name}</Link></> : null}
    </div>
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-3">
        <div className="relative flex min-h-[26rem] items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.36),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(99,102,241,0.3),transparent_38%),linear-gradient(135deg,#eef6ff,#f8fafc_48%,#eef2ff)] p-4 shadow-sm">
          <span className="pointer-events-none absolute -left-16 -top-16 size-52 rounded-full border border-white/80 bg-white/35 blur-2xl" />
          <span className="pointer-events-none absolute -bottom-24 -right-16 size-64 rounded-full border border-white/70 bg-white/35 blur-3xl" />
          {heroImage ? <Image src={heroImage} alt={product.name ?? ""} fill sizes="(min-width: 1024px) 45vw, 100vw" unoptimized className="relative object-contain p-8 drop-shadow-2xl" /> : <div className="relative flex h-64 w-full max-w-[28rem] items-center justify-center"><span className="absolute inset-8 rounded-full bg-indigo-400/20 blur-3xl" /><ProductIllustration kind={productArtKind(`${product.category?.name ?? ""} ${product.name ?? ""}`)} /><span className="absolute bottom-0 rounded-full bg-slate-950/75 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/85">{product.category?.name ?? "gearPC"}</span></div>}
          <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-center justify-between gap-2">
            <Badge className="border-white/80 bg-white/80 text-foreground/75 backdrop-blur">{product.category?.name ?? "gearPC"}</Badge>
            {product.status === ResourceStatus.Active ? <Badge className="border-emerald-200/90 bg-emerald-50/90 text-emerald-700">{t("activeCatalog")}</Badge> : null}
          </div>
        </div>
        {images.length > 1 ? <div className="grid grid-cols-5 gap-2" aria-label={t("productGallery")}>{images.map((image, index) => <button type="button" key={image.id ?? index} className={`overflow-hidden rounded-xl border bg-muted/30 p-1 transition ${activeImage?.id === image.id ? "border-primary ring-2 ring-primary/15" : "hover:border-primary/40"}`} onClick={() => setSelectedImageId(image.id)} aria-label={`${t("viewImage")} ${index + 1}`} aria-pressed={activeImage?.id === image.id}>{image.imageUrl ? <Image src={image.imageUrl} alt={image.name ?? product.name ?? ""} width={128} height={64} unoptimized className="h-16 w-full object-cover" /> : <span className="flex h-16 items-center justify-center"><CatalogCategoryIcon categoryName={product.category?.name ?? product.name} className="size-7 text-primary/45" /></span>}</button>)}</div> : null}
      </div>
      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-3"><div className="flex flex-wrap items-center gap-2"><p className="eyebrow">{product.brand?.name ?? "PC"}</p>{product.category?.name ? <Badge className="border-border bg-muted/70 font-normal text-muted-foreground">{product.category.name}</Badge> : null}</div><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{product.name}</h1><div className="flex items-center gap-2 text-sm text-muted-foreground"><Star className="size-4 fill-amber-400 text-amber-400" />{formatRating(product.ratingAverage)} · {product.reviewCount ?? 0} {t("reviews")}</div></div>
        <p className="leading-7 text-muted-foreground">{product.description ?? t("noDescription")}</p>
        {variants.length > 1 ? (
          <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{t("variants")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("selectedVariant")}
                </p>
              </div>
              <Badge className="bg-background">{variants.length}</Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t("variants")}>
              {variants.map((variant, index) => {
                const active = selected?.id === variant.id;
                const outOfStock = !variant.quantity || variant.quantity < 1;
                return (
                  <button
                    key={variant.id ?? index}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`rounded-xl border p-3 text-left transition ${active ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "bg-background hover:border-primary/40"}`}
                    onClick={() => {
                      setSelectedId(variant.id);
                      setSelectedImageId(undefined);
                      setQuantity((current) => Math.max(1, Math.min(current, variant.quantity ?? 1)));
                      addMutation.reset();
                    }}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block line-clamp-2 text-sm font-medium">
                          {formatVariantLabel(variant)}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {variant.sku ?? "—"}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold">
                        {formatMoney(variant.listPrice, locale)}
                      </span>
                    </span>
                    <span className={`mt-2 block text-xs ${outOfStock ? "text-destructive" : "text-emerald-700"}`}>
                      {outOfStock ? t("outOfStock") : t("stockAvailable", {count: variant.quantity ?? 0})}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {selected ? <div className="space-y-4 rounded-2xl border bg-card p-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">{t("selectedVariant")}</p><p className="text-2xl font-semibold">{formatMoney(selected.listPrice, locale)}</p><p className="mt-1 text-sm text-muted-foreground">{selected.model ?? selected.sku ?? "—"}</p></div><div className="space-y-2"><Label htmlFor="quantity">{t("quantity")}</Label><div className="flex items-center gap-1"><Button type="button" size="icon" variant="outline" aria-label={t("decreaseQuantity")} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus className="size-4" /></Button><Input id="quantity" className="w-16 text-center" type="number" min={1} max={selected.quantity ?? 1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(Number(event.target.value) || 1, selected.quantity ?? 1)))} /><Button type="button" size="icon" variant="outline" aria-label={t("increaseQuantity")} onClick={() => setQuantity((value) => Math.min(selected.quantity ?? value + 1, value + 1))}><Plus className="size-4" /></Button></div></div></div><div className="grid gap-3 border-y py-4 text-sm sm:grid-cols-2"><MetaItem icon={PackageCheck} label={t("stock")} value={selected.quantity && selected.quantity > 0 ? t("stockAvailable", {count: selected.quantity ?? 0}) : t("outOfStock")} /><MetaItem icon={ShieldCheck} label={t("warranty")} value={selected.warranty ?? "—"} /><MetaItem icon={Info} label={t("sku")} value={selected.sku ?? "—"} /><MetaItem icon={Info} label={t("releaseAt")} value={selected.releaseAt ?? "—"} /></div>{addMutation.isError ? <ErrorMessage error={addMutation.error} /> : null}{addMutation.isSuccess ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><span>{t("addedToCart")}</span><Link href="/cart" className="font-semibold underline underline-offset-2">{t("viewCart")}</Link></div> : null}<div className="flex flex-wrap gap-2"><Button size="lg" className="min-w-48 flex-1" disabled={addMutation.isPending || !selected.quantity || selected.quantity < 1} onClick={() => void add()}><ShoppingCart className="size-4" />{addMutation.isPending ? common("loading") : t("addToCart")}</Button>{assistantHref ? <Link href={assistantHref} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted"><Sparkles className="size-4 text-primary" />{t("askAssistant")}</Link> : null}{compareHref ? <Link href={compareHref} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 text-sm font-medium text-primary transition hover:bg-primary/10"><ArrowLeftRight className="size-4" />{t("addToCompare")}</Link> : null}</div></div> : null}
      </div>
    </div>
    {relatedQuery.data?.items?.filter((item) => item.id && item.id !== product.id).slice(0, 4).length ? <section className="mt-12" aria-labelledby="related-products-title"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">{t("relatedProducts")}</p><h2 id="related-products-title" className="mt-2 text-2xl font-semibold">{product.category?.name}</h2></div>{categoryHref ? <Link href={categoryHref} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">{t("viewCategory")}<ChevronRight className="size-4" /></Link> : null}</div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{relatedQuery.data?.items?.filter((item) => item.id && item.id !== product.id).slice(0, 4).map((item) => <ProductCard key={item.id} product={item} />)}</div></section> : null}
    <section className="mt-12" aria-labelledby="specifications-title"><div className="mb-5"><p className="eyebrow">{t("specifications")}</p><h2 id="specifications-title" className="mt-2 text-2xl font-semibold">{t("technicalDetails")}</h2></div>{specifications.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">{t("specificationsEmpty")}</div> : <Card><CardContent className="grid gap-px overflow-hidden p-0 sm:grid-cols-2">{specifications.map(([key, value]) => <div key={key} className="flex min-h-14 items-start justify-between gap-5 border-b bg-muted/15 px-5 py-3.5 text-sm last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"><span className="font-medium text-muted-foreground">{formatSpecificationLabel(key)}</span><span className="max-w-[65%] text-right font-medium">{formatSpecificationValue(value)}</span></div>)}</CardContent></Card>}</section>
    <section className="mt-14"><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow">{t("reviews")}</p><h2 className="mt-2 text-2xl font-semibold">{t("customerReviews")}</h2></div><span className="text-sm text-muted-foreground">{product.reviewCount ?? reviews.data?.size ?? 0}</span></div>{ratingSummary.data ? <RatingSummary summary={ratingSummary.data} /> : null}{reviews.isPending ? <div className="h-24 animate-pulse rounded-2xl bg-muted" /> : reviews.isError ? <ErrorMessage error={reviews.error} /> : (reviews.data?.items ?? []).length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">{t("noReviews")}</div> : <><div className="grid gap-4 md:grid-cols-2">{reviews.data?.items?.map((review) => <Card key={review.id}><CardContent className="space-y-2 p-5"><div className="flex items-center justify-between"><span className="font-medium">{review.customerName ?? t("verifiedBuyer")}</span><span className="flex items-center gap-1 text-sm"><Star className="size-4 fill-amber-400 text-amber-400" />{review.rating}/5</span></div><p className="text-sm leading-6 text-muted-foreground">{review.comment || "—"}</p></CardContent></Card>)}</div>{(reviews.data?.hasPrev || reviews.data?.hasNext) ? <div className="mt-6 flex justify-center gap-2"><Button variant="outline" disabled={!reviews.data?.hasPrev || !reviews.data?.prevCursor} onClick={() => setReviewCursor(reviews.data?.prevCursor)}><ChevronLeft className="size-4" />{t("previous")}</Button><Button variant="outline" disabled={!reviews.data?.hasNext || !reviews.data?.nextCursor} onClick={() => setReviewCursor(reviews.data?.nextCursor)}>{t("next")}<ChevronRight className="size-4" /></Button></div> : null}</>}</section>
  </section>;
}

function RatingSummary({summary}: {summary: import("@/features/catalog/contracts/responses").ProductRatingSummary}) {
  const t = useTranslations("catalog");
  const average = summary.averageRating ?? 0;
  const total = summary.totalReviews ?? 0;
  const distribution = summary.ratingDistribution ?? {};
  return (
    <div className="mb-6 grid gap-5 rounded-2xl border bg-card p-5 sm:grid-cols-[11rem_1fr] sm:items-center">
      <div className="text-center sm:border-r sm:pr-5">
        <p className="text-4xl font-semibold tracking-tight">{average.toFixed(1)}</p>
        <div className="mt-2 flex justify-center gap-0.5" aria-label={`${average}/5`}>
          {Array.from({length: 5}, (_, index) => <Star key={index} className={`size-4 ${index < Math.round(average) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"}`} />)}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{total} {t("totalReviews")}</p>
      </div>
      <div className="space-y-2.5">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[String(rating)] ?? distribution[rating] ?? 0;
          const width = total > 0 ? `${Math.min(100, (count / total) * 100)}%` : "0%";
          return <div key={rating} className="flex items-center gap-3 text-xs"><span className="w-7 shrink-0 text-right font-medium">{rating}★</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-amber-400 transition-[width]" style={{width}} /></span><span className="w-7 shrink-0 text-right text-muted-foreground">{count}</span></div>;
        })}
      </div>
    </div>
  );
}

function MetaItem({icon: Icon, label, value}: {icon: LucideIcon; label: string; value: string}) {
  return <div className="flex min-w-0 items-start gap-2.5"><Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span className="min-w-0"><span className="block text-xs text-muted-foreground">{label}</span><span className="mt-0.5 block truncate font-medium">{value}</span></span></div>;
}

function formatSpecificationLabel(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatVariantLabel(variant: NonNullable<import("@/features/catalog/contracts/responses").ProductDetail["variants"]>[number]) {
  const options = (variant.options ?? [])
    .map((option) => [option.type, option.value].filter(Boolean).join(": "))
    .filter(Boolean);
  return options.join(" · ") || variant.model || variant.sku || "SKU";
}

function formatSpecificationValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => formatSpecificationValue(item)).join(" · ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value) ?? "—";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}
