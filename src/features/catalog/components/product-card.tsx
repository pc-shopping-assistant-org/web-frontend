"use client";

import {IconArrowUpRight, IconArrowsLeftRight, IconCheck, IconLoader2, IconShoppingCart, IconSparkles, IconStar} from "@tabler/icons-react";
import Image from "next/image";
import {useLocale, useTranslations} from "next-intl";
import {useState, type MouseEvent} from "react";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Link} from "@/i18n/navigation";
import {useRouter} from "@/i18n/navigation";
import type {ProductSummary} from "@/features/catalog/contracts/responses";
import {formatMoney, formatRating} from "@/lib/format";
import {cn} from "@/lib/utils";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

import {useAddToCart} from "@/features/cart/queries";
import {getProductBySlug} from "../api";

type ProductTheme = {
  visual: string;
};

// Keep the fallback artwork visually distinct even while the local catalog is
// still being populated with media files. These classes are intentionally
// literal so Tailwind includes every palette in the production build.
const PRODUCT_THEMES: {match: RegExp; theme: ProductTheme}[] = [
  {match: /laptop|notebook/i, theme: {visual: "bg-[linear-gradient(135deg,#e0f2fe,#eef2ff_52%,#f8fafc)]"}},
  {match: /gaming/i, theme: {visual: "bg-[linear-gradient(135deg,#ede9fe,#f5f3ff_52%,#faf5ff)]"}},
  {match: /phone|điện thoại|mobile/i, theme: {visual: "bg-[linear-gradient(135deg,#dbeafe,#eff6ff_52%,#f8fafc)]"}},
  {match: /pc|main|cpu|vga|case|nguồn|tản/i, theme: {visual: "bg-[linear-gradient(135deg,#dcfce7,#ecfdf5_52%,#f8fafc)]"}},
  {match: /màn hình|monitor|display/i, theme: {visual: "bg-[linear-gradient(135deg,#ffedd5,#fff7ed_52%,#f8fafc)]"}},
  {match: /loa|micro|webcam|tai nghe|audio/i, theme: {visual: "bg-[linear-gradient(135deg,#ffe4e6,#fff1f2_52%,#f8fafc)]"}},
  {match: /ổ cứng|ram|thẻ nhớ|storage|memory/i, theme: {visual: "bg-[linear-gradient(135deg,#cffafe,#ecfeff_52%,#f8fafc)]"}},
  {match: /bàn phím|chuột|phụ kiện|console/i, theme: {visual: "bg-[linear-gradient(135deg,#fce7f3,#fdf2f8_52%,#f8fafc)]"}},
  {match: /ghế|bàn|software|phần mềm|mạng|network/i, theme: {visual: "bg-[linear-gradient(135deg,#fef3c7,#fffbeb_52%,#f8fafc)]"}},
];

const DEFAULT_THEME: ProductTheme = {
  visual: "bg-[linear-gradient(135deg,#f1f5f9,#f8fafc_52%,#eef2ff)]",
};

function productTheme(categoryName?: string | null) {
  return PRODUCT_THEMES.find(({match}) => match.test(categoryName ?? ""))?.theme ?? DEFAULT_THEME;
}

export function ProductCard({
  product,
  compact = false,
  compareSelected = false,
  compareDisabled = false,
  onCompareToggle,
}: {
  product: ProductSummary;
  /** Dense presentation used by merchandising rails on the storefront. */
  compact?: boolean;
  compareSelected?: boolean;
  compareDisabled?: boolean;
  onCompareToggle?: (product: ProductSummary) => void;
}) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const addToCart = useAddToCart();
  const [added, setAdded] = useState(false);
  const [quickAddError, setQuickAddError] = useState<unknown>(null);
  const [quickAddMessage, setQuickAddMessage] = useState<string | null>(null);
  const name = product.name ?? t("productNotFound");
  const productHref = product.seoName
    ? `/products/${encodeURIComponent(product.seoName)}`
    : undefined;
  const price = product.minPrice ?? product.maxPrice;
  const theme = productTheme(product.categoryName);

  async function quickAdd(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!product.seoName || addToCart.isPending) return;

    setAdded(false);
    setQuickAddError(null);
    setQuickAddMessage(null);
    try {
      // Product summaries intentionally stay small and do not include a SKU.
      // Resolve the detail lazily so browse pages do not issue one variant
      // request for every card during the initial render.
      const detail = await getProductBySlug(product.seoName);
      const activeVariants = (detail.variants ?? []).filter(
        (variant) => !variant.status || variant.status === ResourceStatus.Active,
      );
      if (activeVariants.length !== 1) {
        router.push(productHref ?? "/products");
        return;
      }
      const variant = activeVariants[0];
      if (!variant.id || !variant.quantity || variant.quantity < 1) {
        setQuickAddMessage(t("outOfStock"));
        return;
      }
      await addToCart.mutateAsync({productVariantId: variant.id, quantity: 1});
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2600);
    } catch (cause) {
      // The error is rendered locally so one unavailable SKU does not replace
      // the whole catalog result.
      setQuickAddError(cause);
    }
  }

  return (
    <Card className={cn("group overflow-hidden border-border/70 transition duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl", compact && "hover:-translate-y-0.5 hover:shadow-lg")}>
      {productHref ? (
        <Link href={productHref} className="block" aria-label={`${t("productDetails")}: ${name}`}>
          <ProductVisual product={product} name={name} theme={theme} interactive compact={compact} />
        </Link>
      ) : (
        <ProductVisual product={product} name={name} theme={theme} compact={compact} />
      )}
      <CardContent className={cn("flex flex-col gap-3 p-5", compact ? "min-h-40 gap-2.5 p-4" : "min-h-48")}>
        <div className="space-y-1">
          <p className={cn("text-xs font-medium uppercase tracking-wider text-muted-foreground", compact && "text-[0.68rem]")}>
            {product.brandName ?? t("brandFallback")}
          </p>
          <h3 className={cn("line-clamp-2 font-semibold tracking-tight", compact ? "text-sm leading-5" : "text-lg")}>
            {productHref ? (
              <Link href={productHref} className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                {name}
              </Link>
            ) : name}
          </h3>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("from")}</p>
            <p className={cn("font-semibold", compact ? "text-base" : "text-lg")}>{formatMoney(price, locale)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <IconStar className="size-3 fill-amber-400 text-amber-400" />
              {formatRating(product.ratingAverage)} · {product.reviewCount ?? 0} {t("reviews")}
            </p>
          </div>
        </div>
        {productHref || product.id ? (
          <div className={cn("space-y-2 border-t pt-3", compact && "pt-2")}>
            {addToCart.isError || quickAddError ? <ErrorMessage error={quickAddError ?? addToCart.error} /> : null}
            {quickAddMessage ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">{quickAddMessage}</p> : null}
            {added ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                <IconCheck className="size-3.5" />
                {t("addedToCart")}
              </div>
            ) : null}
            {productHref ? (
              <Link href={productHref} className={cn("inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85", compact ? "h-8 text-xs" : "h-9")}>
                {t("productDetails")}
                <IconArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            ) : null}
            <div className="grid grid-cols-3 gap-2">
              {productHref ? (
                <button
                  type="button"
                  className={cn("inline-flex min-w-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 px-0 text-primary transition hover:bg-primary/10 disabled:cursor-wait disabled:opacity-60", compact ? "h-8" : "h-9")}
                  onClick={(event) => void quickAdd(event)}
                  disabled={addToCart.isPending}
                  aria-label={addToCart.isPending ? t("addingToCart") : t("quickAdd")}
                  title={addToCart.isPending ? t("addingToCart") : t("quickAdd")}
                >
                  {addToCart.isPending ? <IconLoader2 className="size-4 animate-spin" /> : <IconShoppingCart className="size-4" />}
                </button>
              ) : <span />}
              {onCompareToggle && product.id ? (
                <button
                  type="button"
                  className={cn(
                    "inline-flex min-w-0 items-center justify-center rounded-lg border px-0 transition disabled:cursor-not-allowed disabled:opacity-50",
                    compact ? "h-8" : "h-9",
                    compareSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5",
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onCompareToggle(product);
                  }}
                  disabled={compareDisabled && !compareSelected}
                  aria-pressed={compareSelected}
                  aria-label={
                    compareSelected
                      ? t("removeFromCompare")
                      : t("addToCompare")
                  }
                  title={
                    compareSelected
                      ? t("removeFromCompare")
                      : t("addToCompare")
                  }
                >
                  <IconArrowsLeftRight className="size-4" />
                </button>
              ) : product.id ? (
                <Link
                  href={`/assistant?mode=COMPARE&productIds=${encodeURIComponent(product.id)}`}
                  className={cn("inline-flex min-w-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 px-0 text-primary transition hover:bg-primary/10", compact ? "h-8" : "h-9")}
                  aria-label={t("addToCompare")}
                  title={t("addToCompare")}
                >
                  <IconArrowsLeftRight className="size-4" />
                </Link>
              ) : <span />}
              {product.id ? (
                <Link href={`/assistant?mode=EVALUATE&productId=${encodeURIComponent(product.id)}`} className={cn("inline-flex min-w-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 px-0 text-primary transition hover:bg-primary/10", compact ? "h-8" : "h-9")} aria-label={t("askAssistant")} title={t("askAssistant")}>
                  <IconSparkles className="size-4" />
                </Link>
              ) : <span />}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProductVisual({
  product,
  name,
  theme,
  interactive = false,
  compact = false,
}: {
  product: ProductSummary;
  name: string;
  theme: ProductTheme;
  interactive?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("catalog");
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden p-5", compact ? "h-40" : "h-56", theme.visual)}>
      <span className="pointer-events-none absolute -left-8 -top-10 size-32 rounded-full bg-white/65 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-12 -right-10 size-40 rounded-full bg-white/55 blur-3xl" />
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={name}
          fill
          sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          unoptimized
          className={cn("object-contain p-7", interactive && "transition duration-300 group-hover:scale-105")}
        />
      ) : (
        <ProductFallbackArt product={product} name={name} interactive={interactive} compact={compact} />
      )}
      <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
        <Badge className="max-w-[65%] truncate border-white/80 bg-white/80 text-xs text-foreground/70 backdrop-blur">
          {product.categoryName ?? t("category")}
        </Badge>
        {product.status === ResourceStatus.Active ? (
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{t("activeCatalog")}</Badge>
        ) : product.status ? (
          <Badge className="border-slate-200 bg-slate-100 text-slate-600">{t("inactiveCatalog")}</Badge>
        ) : null}
      </div>
    </div>
  );
}

function ProductFallbackArt({
  product,
  name,
  interactive,
  compact = false,
}: {
  product: ProductSummary;
  name: string;
  interactive: boolean;
  compact?: boolean;
}) {
  const category = `${product.categoryName ?? ""} ${name}`;
  const kind = productArtKind(category);

  return (
    <div className={cn("relative flex w-full items-center justify-center transition duration-300", compact ? "h-32 max-w-[14rem]" : "h-44 max-w-[18rem]", interactive && "group-hover:scale-[1.04]")} aria-hidden="true">
      <span className="absolute inset-8 rounded-full bg-white/60 blur-3xl" />
      <span className="absolute inset-x-8 bottom-3 h-8 rounded-[50%] bg-slate-900/15 blur-xl" />
      <div className={cn("relative z-10 w-full rounded-[2.25rem] border border-white/80 bg-white/35 p-2 shadow-inner backdrop-blur-[2px]", compact ? "h-28 max-w-[14rem]" : "h-40 max-w-[18rem]")}>
        <div className="flex h-full items-center justify-center overflow-hidden rounded-[1.85rem] border border-white/70 bg-white/30">
          <ProductIllustration kind={kind} />
        </div>
      </div>
      <span className="absolute bottom-5 z-10 max-w-[80%] truncate rounded-full bg-slate-950/75 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-white/85">
        {product.categoryName ?? "gearPC"}
      </span>
    </div>
  );
}

export type ProductArtKind = "laptop" | "phone" | "monitor" | "desktop" | "audio" | "keyboard" | "mouse" | "storage" | "chair" | "network" | "generic";

export function productArtKind(value: string): ProductArtKind {
  if (/phone|điện thoại|mobile/i.test(value)) return "phone";
  if (/laptop|notebook/i.test(value)) return "laptop";
  if (/màn hình|monitor|display/i.test(value)) return "monitor";
  if (/bàn phím|keyboard/i.test(value)) return "keyboard";
  if (/chuột|mouse/i.test(value)) return "mouse";
  if (/loa|micro|webcam|tai nghe|audio/i.test(value)) return "audio";
  if (/ổ cứng|ram|thẻ nhớ|storage|memory/i.test(value)) return "storage";
  if (/ghế|bàn|chair|desk/i.test(value)) return "chair";
  if (/phần mềm|mạng|network|wifi/i.test(value)) return "network";
  if (/pc|desktop|case|main|cpu|vga|nguồn|tản/i.test(value)) return "desktop";
  return "generic";
}

export function ProductIllustration({kind}: {kind: ProductArtKind}) {
  const gradientId = `product-art-${kind}`;
  const screen = `url(#${gradientId})`;
  return (
    <svg viewBox="0 0 320 190" className="h-full w-full drop-shadow-[0_16px_18px_rgba(15,23,42,.2)]" role="presentation">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="0.52" stopColor="#6366f1" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`${gradientId}-light`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8fafc" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>
      {kind === "laptop" ? <>
        <rect x="69" y="29" width="182" height="104" rx="15" fill="#172033" stroke="#64748b" strokeWidth="8" />
        <rect x="82" y="42" width="156" height="78" rx="8" fill={screen} />
        <path d="M47 146h226l-18 17H65z" fill="#475569" stroke="#1e293b" strokeWidth="3" />
        <path d="M137 149h46l6 7h-58z" fill="#94a3b8" />
        <path d="M95 62h54" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round" opacity=".75" />
        <circle cx="213" cy="105" r="4" fill="#67e8f9" />
      </> : null}
      {kind === "phone" ? <>
        <rect x="112" y="12" width="96" height="166" rx="20" fill="#172033" stroke="#64748b" strokeWidth="7" />
        <rect x="123" y="28" width="74" height="131" rx="12" fill={screen} />
        <rect x="150" y="18" width="20" height="4" rx="2" fill="#94a3b8" />
        <circle cx="160" cy="168" r="4" fill="#94a3b8" />
        <path d="M136 58h38" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round" opacity=".8" />
        <circle cx="178" cy="56" r="5" fill="#67e8f9" />
      </> : null}
      {kind === "monitor" ? <>
        <rect x="52" y="31" width="216" height="113" rx="13" fill="#172033" stroke="#64748b" strokeWidth="8" />
        <rect x="66" y="45" width="188" height="85" rx="6" fill={screen} />
        <path d="M160 145v25" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
        <path d="M121 173h78" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
        <path d="M83 64h54" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round" opacity=".75" />
      </> : null}
      {kind === "desktop" ? <>
        <rect x="100" y="17" width="120" height="155" rx="19" fill="#172033" stroke="#64748b" strokeWidth="8" />
        <rect x="118" y="37" width="84" height="91" rx="9" fill="#263752" stroke="#475569" strokeWidth="3" />
        <path d="M128 54h64M128 66h64M128 78h42" stroke="#64748b" strokeWidth="4" strokeLinecap="round" opacity=".8" />
        <circle cx="122" cy="145" r="5" fill="#67e8f9" />
        <path d="M135 145h55" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" />
      </> : null}
      {kind === "audio" ? <>
        <circle cx="160" cy="95" r="66" fill="#172033" stroke="#64748b" strokeWidth="8" />
        <circle cx="160" cy="95" r="43" fill="#263752" stroke="#94a3b8" strokeWidth="4" />
        <circle cx="160" cy="95" r="22" fill={screen} />
        <path d="M160 73v44M138 95h44" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round" opacity=".75" />
      </> : null}
      {kind === "keyboard" ? <>
        <rect x="38" y="60" width="244" height="80" rx="18" fill="#172033" stroke="#64748b" strokeWidth="7" />
        <g fill="#94a3b8">{Array.from({length: 48}, (_, index) => { const x = 58 + (index % 12) * 18; const y = 79 + Math.floor(index / 12) * 14; return <rect key={index} x={x} y={y} width="11" height="7" rx="2" />; })}</g>
        <rect x="126" y="121" width="68" height="7" rx="3" fill="#67e8f9" />
      </> : null}
      {kind === "mouse" ? <>
        <path d="M160 20c-36 0-57 29-57 71s21 75 57 75 57-33 57-75-21-71-57-71z" fill="#172033" stroke="#64748b" strokeWidth="8" />
        <path d="M160 23v64" stroke="#94a3b8" strokeWidth="5" />
        <rect x="154" y="41" width="12" height="22" rx="6" fill="#67e8f9" />
        <path d="M118 118c18 17 66 17 84 0" stroke="#475569" strokeWidth="5" fill="none" />
      </> : null}
      {kind === "storage" ? <>
        <rect x="76" y="35" width="168" height="120" rx="18" fill="#172033" stroke="#64748b" strokeWidth="8" />
        <rect x="98" y="57" width="124" height="54" rx="9" fill="#263752" />
        <circle cx="118" cy="84" r="12" fill={screen} />
        <path d="M146 78h53M146 92h33" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
        <path d="M104 132h112" stroke="#67e8f9" strokeWidth="5" strokeLinecap="round" />
      </> : null}
      {kind === "chair" ? <>
        <path d="M100 34c0-10 8-18 18-18h83c13 0 23 10 23 23v62c0 10-8 18-18 18h-88c-10 0-18-8-18-18z" fill="#172033" stroke="#64748b" strokeWidth="8" />
        <path d="M112 120h98l20 18H92z" fill="#475569" />
        <path d="M160 138v28M126 176h68" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
        <path d="M122 61h78" stroke="#a78bfa" strokeWidth="5" strokeLinecap="round" />
      </> : null}
      {kind === "network" ? <>
        <rect x="64" y="57" width="192" height="83" rx="17" fill="#172033" stroke="#64748b" strokeWidth="8" />
        <circle cx="100" cy="98" r="9" fill="#67e8f9" />
        <circle cx="128" cy="98" r="9" fill="#a78bfa" />
        <circle cx="156" cy="98" r="9" fill="#34d399" />
        <path d="M194 84h34M194 100h34M194 116h22" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
        <path d="M94 148h132" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
      </> : null}
      {kind === "generic" ? <>
        <rect x="91" y="36" width="138" height="118" rx="24" fill="#172033" stroke="#64748b" strokeWidth="8" />
        <path d="M117 72h86M117 95h62M117 118h75" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" />
        <circle cx="201" cy="119" r="8" fill="#67e8f9" />
      </> : null}
    </svg>
  );
}
