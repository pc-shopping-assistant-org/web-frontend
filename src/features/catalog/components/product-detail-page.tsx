"use client";

import {ArrowLeftRight, Check, ChevronRight, Minus, Plus, ShoppingCart, Sparkles, Star} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import Image from "next/image";
import {useEffect, useMemo, useRef, useState, type ReactNode} from "react";

import {ProductReviews} from "./product-reviews";
import {Button} from "@/components/ui/button";
import {ErrorMessage} from "@/components/ui/error-message";
import {ProductDetailPageSkeleton} from "@/components/ui/loading-skeletons";
import {Link, usePathname, useRouter} from "@/i18n/navigation";
import {MAX_CART_LINE_QUANTITY} from "@/lib/api/contracts/primitives";
import {ApiClientError} from "@/lib/api/envelope";
import {formatMoney} from "@/lib/format";
import {ResourceStatus} from "@/lib/domain/catalog-enums";
import {cn} from "@/lib/utils";

import {useAddToCart, useCart} from "@/features/cart/queries";
import {useCategorySpecLabels, useProductBySlug, useProductReviews, useProducts} from "../queries";
import {CatalogCategoryIcon} from "./catalog-category-icon";
import {ProductCard} from "./product-card";
import {ProductGalleryStrip} from "./product-gallery-strip";
import {ProductIllustration, productArtKind} from "./product-card";

type Variant = NonNullable<import("@/features/catalog/contracts/responses").ProductDetail["variants"]>[number];

const RELATED_COUNT = 5;

export function ProductDetailPage({slug}: {slug: string}) {
  const t = useTranslations("catalog");
  const common = useTranslations("common");
  const locale = useLocale();
  const query = useProductBySlug(slug);
  const product = query.data;
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const addMutation = useAddToCart();
  const cart = useCart(false);
  const router = useRouter();
  const pathname = usePathname();
  const [belowFoldRef, belowFoldReady] = useNearViewport<HTMLDivElement>(Boolean(product));
  const relatedQuery = useProducts(
    {categoryId: product?.category?.id, limit: RELATED_COUNT + 1},
    {enabled: Boolean(product?.category?.id) && belowFoldReady},
  );

  const variants = useMemo(
    () => (product?.variants ?? []).filter((variant) => !variant.status || variant.status === ResourceStatus.Active),
    [product?.variants],
  );
  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0];
  // The one thing the variants differ by ("Màu"), when there is just one: it titles the row and the buttons say only the value
  const optionAxis = singleOptionName(variants);
  const reviews = useProductReviews(product?.id ?? "");
  const images = product?.images ?? [];
  // A variant with its own image shows it until the shopper picks a gallery image
  const activeImage =
    images.find((image) => image.id === selectedImageId) ??
    (selected?.imageUrl ? undefined : (images.find((image) => image.main) ?? images[0]));
  const heroImage = activeImage?.imageUrl ?? selected?.imageUrl ?? product?.imageUrl;
  const specLabels = useCategorySpecLabels(product?.category?.id).data;
  const specifications = Object.entries(product?.specifications ?? {})
    .filter(([key, value]) => key.trim() && value !== null && value !== undefined)
    .sort(([a], [b]) => (specLabels?.[a]?.order ?? Number.MAX_SAFE_INTEGER) - (specLabels?.[b]?.order ?? Number.MAX_SAFE_INTEGER));
  const categoryHref = product?.category?.id ? `/products?categoryId=${encodeURIComponent(product.category.id)}` : undefined;
  const assistantHref = product?.id ? `/assistant?productId=${encodeURIComponent(product.id)}` : undefined;
  const compareHref = product?.id ? `/assistant?productIds=${encodeURIComponent(product.id)}` : undefined;

  if (query.isPending) return <ProductDetailPageSkeleton />;
  if (query.isError || !product) {
    const notFound = query.error instanceof ApiClientError && query.error.status === 404;
    return (
      <section className="page-wrap py-16">
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <h1 className="text-2xl font-semibold">{notFound ? t("productNotFound") : t("loadError")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{notFound ? null : common("unknownError")}</p>
          <Link href="/products" className="mt-6 inline-flex text-sm font-medium text-primary hover:underline">
            {common("back")}
          </Link>
        </div>
      </section>
    );
  }

  // The cart holds at most MAX_CART_LINE_QUANTITY of a variant: add only what still fits, and nothing once it is full.
  const inCart = cart.data?.items.find((item) => item.productVariantId === selected?.id)?.quantity ?? 0;
  const room = Math.max(0, MAX_CART_LINE_QUANTITY - inCart);
  const stock = selected?.quantity ?? 0;
  const maxQuantity = Math.max(1, Math.min(stock, MAX_CART_LINE_QUANTITY));
  const canBuy = Boolean(selected?.id) && stock > 0 && room > 0;
  const related = (relatedQuery.data?.items ?? []).filter((item) => item.id && item.id !== product.id).slice(0, RELATED_COUNT);

  /** True when the line is in the cart; a visitor who is not signed in is sent to sign in and back here. */
  async function add() {
    if (!selected?.id || !canBuy) return false;
    try {
      await addMutation.mutateAsync({productVariantId: selected.id, quantity: Math.min(quantity, room)});
      return true;
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 401) router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return false;
    }
  }

  async function buyNow() {
    if (await add()) router.push("/cart");
  }

  return (
    <section className="page-wrap py-6 sm:py-8">
      <nav aria-label="breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-primary">
          {t("title")}
        </Link>
        {categoryHref ? (
          <>
            <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
            <Link href={categoryHref} className="hover:text-primary">
              {product.category?.name}
            </Link>
          </>
        ) : null}
        <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 truncate text-foreground" aria-current="page">
          {product.name}
        </span>
      </nav>

      <div className="grid gap-6 rounded-xl border bg-card p-4 sm:p-6 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:gap-10">
        <div className="min-w-0 space-y-3">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-muted/20">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={product.name ?? ""}
                fill
                sizes="(min-width: 1024px) 27rem, 100vw"
                priority
                unoptimized
                className="object-contain p-4"
              />
            ) : (
              <div className="relative flex h-64 w-full max-w-[24rem] items-center justify-center">
                <ProductIllustration kind={productArtKind(`${product.category?.name ?? ""} ${product.name ?? ""}`)} />
                <span className="absolute bottom-0 rounded-full bg-slate-950/75 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/85">
                  {product.category?.name ?? "gearPC"}
                </span>
              </div>
            )}
          </div>
          {images.length > 1 ? (
            <ProductGalleryStrip
              images={images}
              activeId={activeImage?.id}
              alt={product.name ?? ""}
              onSelect={setSelectedImageId}
              placeholder={<CatalogCategoryIcon categoryName={product.category?.name ?? product.name} className="size-6 text-primary/45" />}
            />
          ) : null}
        </div>

        <div className="min-w-0">
          <h1 className="text-xl font-medium leading-snug sm:text-2xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {product.brand?.name ? (
              <span className="font-medium uppercase tracking-wide text-foreground/70">{product.brand.name}</span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              {reviews.data && reviews.data.totalElements > 0 ? t("reviewsCount", {count: reviews.data.totalElements}) : t("noReviews")}
            </span>
          </div>

          {selected ? (
            <div className="mt-4 rounded-lg bg-muted/50 px-4 py-3.5 sm:px-5">
              <p className="text-3xl font-medium tracking-tight text-primary">{formatMoney(selected.price, locale)}</p>
            </div>
          ) : null}

          {selected ? (
            <div className="mt-6 space-y-5">
              {variants.length > 1 ? (
                <Row label={optionAxis ?? t("variantLabel")}>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("variants")}>
                    {variants.map((variant, index) => {
                      const active = selected.id === variant.id;
                      const soldOut = !variant.quantity || variant.quantity < 1;
                      return (
                        <button
                          key={variant.id ?? index}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          title={
                            soldOut
                              ? `${variantChipLabel(variant, optionAxis)} · ${t("outOfStock")}`
                              : variantChipLabel(variant, optionAxis)
                          }
                          className={cn(
                            "relative max-w-full overflow-hidden rounded-md border px-3 py-1.5 text-left text-sm transition",
                            active ? "border-primary text-primary" : "bg-background hover:border-primary hover:text-primary",
                            soldOut && !active && "text-muted-foreground",
                          )}
                          onClick={() => {
                            setSelectedId(variant.id);
                            setSelectedImageId(undefined);
                            setQuantity((current) => Math.max(1, Math.min(current, variant.quantity ?? 1)));
                            addMutation.reset();
                          }}
                        >
                          <span className="block truncate">{variantChipLabel(variant, optionAxis)}</span>
                          {active ? (
                            <span
                              className="absolute bottom-0 right-0 flex size-4 items-center justify-center rounded-tl-md bg-primary text-primary-foreground"
                              aria-hidden="true"
                            >
                              <Check className="size-3" />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </Row>
              ) : null}

              <Row label={t("quantity")} center>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex h-9 items-stretch overflow-hidden rounded-md border">
                    <button
                      type="button"
                      className="flex w-9 items-center justify-center transition hover:bg-muted disabled:opacity-40"
                      aria-label={t("decreaseQuantity")}
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    >
                      <Minus className="size-4" />
                    </button>
                    <input
                      id="quantity"
                      aria-label={t("quantity")}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={maxQuantity}
                      value={quantity}
                      onChange={(event) => setQuantity(Math.max(1, Math.min(Number(event.target.value) || 1, maxQuantity)))}
                      className="w-14 border-x bg-background text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      className="flex w-9 items-center justify-center transition hover:bg-muted disabled:opacity-40"
                      aria-label={t("increaseQuantity")}
                      disabled={quantity >= maxQuantity}
                      onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <span className={cn("text-sm", stock > 0 ? "text-muted-foreground" : "font-medium text-destructive")}>
                    {stock > 0 ? t("inStockCount", {count: stock}) : t("outOfStock")}
                  </span>
                </div>
              </Row>

              {selected.warrantyMonths ? (
                <Row label={t("warranty")} center>
                  <span className="text-sm">{t("warrantyMonths", {count: selected.warrantyMonths})}</span>
                </Row>
              ) : null}
              <Row label={t("sku")} center>
                <span className="text-sm text-muted-foreground">{selected.sku ?? "—"}</span>
              </Row>
            </div>
          ) : null}

          {selected ? (
            <div className="mt-6 space-y-3">
              {addMutation.isError ? <ErrorMessage error={addMutation.error} /> : null}
              {addMutation.isSuccess ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <span>{t("addedToCart")}</span>
                  <Link href="/cart" className="font-semibold underline underline-offset-2">
                    {t("viewCart")}
                  </Link>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 min-w-44 flex-1 border-primary bg-primary/5 text-primary hover:bg-primary/10 sm:flex-none sm:px-6"
                  disabled={addMutation.isPending || !canBuy}
                  onClick={() => void add()}
                >
                  <ShoppingCart className="size-4" />
                  {addMutation.isPending ? common("loading") : t("addToCart")}
                </Button>
                <Button
                  size="lg"
                  className="h-11 min-w-36 flex-1 sm:flex-none sm:px-10"
                  disabled={addMutation.isPending || !canBuy}
                  onClick={() => void buyNow()}
                >
                  {t("buyNow")}
                </Button>
              </div>
              {assistantHref || compareHref ? (
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {assistantHref ? (
                    <Link
                      href={assistantHref}
                      className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-primary"
                    >
                      <Sparkles className="size-4" />
                      {t("askAssistant")}
                    </Link>
                  ) : null}
                  {compareHref ? (
                    <Link
                      href={compareHref}
                      className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-primary"
                    >
                      <ArrowLeftRight className="size-4" />
                      {t("addToCompare")}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div ref={belowFoldRef} className="[content-visibility:auto] [contain-intrinsic-size:1400px]">
        <Panel title={t("technicalDetails")}>
          {specifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("specificationsEmpty")}</p>
          ) : (
            <dl className="text-sm">
              {specifications.map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-4 border-b border-border/60 py-2.5 last:border-b-0 sm:grid-cols-[11rem_minmax(0,1fr)]"
                >
                  <dt className="text-muted-foreground">{specLabels?.[key]?.label ?? formatSpecificationLabel(key)}</dt>
                  <dd className="break-words">
                    {formatSpecificationValue(value)}
                    {specLabels?.[key]?.unit ? ` ${specLabels[key].unit}` : ""}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Panel>

        <Panel title={t("descriptionTitle")}>
          <p className="whitespace-pre-line text-sm leading-7">{product.description ?? t("noDescription")}</p>
        </Panel>

        <ProductReviews productId={product.id} enabled={belowFoldReady} />

        {related.length ? (
          <section className="mt-6" aria-labelledby="related-products-title">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 id="related-products-title" className="text-base font-medium uppercase tracking-wide text-muted-foreground">
                {t("relatedProducts")}
              </h2>
              {categoryHref ? (
                <Link href={categoryHref} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  {t("viewCategory")}
                  <ChevronRight className="size-4" />
                </Link>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} variant="listing" />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

/** A label and its control on one line, the way the product facts are laid out on the page. */
function Row({label, center = false, children}: {label: string; center?: boolean; children: ReactNode}) {
  return (
    <div className={cn("grid gap-2 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4", center ? "sm:items-center" : "sm:items-baseline")}>
      <p className="text-sm capitalize text-muted-foreground">{label}</p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** A white section under the product with a grey title bar. */
function Panel({title, children}: {title: string; children: ReactNode}) {
  return (
    <section className="mt-6 overflow-hidden rounded-xl border bg-card">
      <h2 className="bg-muted/50 px-4 py-3 text-base font-medium uppercase tracking-wide sm:px-6">{title}</h2>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

function useNearViewport<T extends HTMLElement>(active = true, rootMargin = "600px") {
  const ref = useRef<T | null>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    if (!active) return;
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNearViewport(true);
        observer.disconnect();
      },
      {rootMargin},
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [active, rootMargin]);

  return [ref, nearViewport] as const;
}

function formatSpecificationLabel(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** The name of the option when every variant has exactly that one ("Màu"); otherwise undefined and each button spells out its options. */
function singleOptionName(variants: Variant[]) {
  const names = new Set(variants.flatMap((variant) => (variant.options ?? []).map((option) => option.name)));
  const only = names.size === 1 ? [...names][0] : undefined;
  return only && variants.every((variant) => (variant.options ?? []).length === 1) ? only : undefined;
}

/** What tells a variant apart: just its value under a single option ("Xanh"), else "Màu: Xanh · RAM: 16GB", else its model or SKU. */
function variantChipLabel(variant: Variant, optionAxis?: string) {
  const options = variant.options ?? [];
  const text = optionAxis
    ? options
        .map((option) => option.value)
        .filter(Boolean)
        .join(" · ")
    : options
        .map((option) => [option.name, option.value].filter(Boolean).join(": "))
        .filter(Boolean)
        .join(" · ");
  return text || variant.model || variant.sku || "SKU";
}

function formatSpecificationValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => formatSpecificationValue(item)).join(" · ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value) ?? "—";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}
