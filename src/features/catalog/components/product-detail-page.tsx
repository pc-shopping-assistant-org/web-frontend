"use client";

import {ArrowLeft, Check, Star} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Link} from "@/i18n/navigation";
import {ApiClientError} from "@/lib/api/envelope";
import {formatMoney, formatRating} from "@/lib/format";

import {useProductBySlug} from "../queries";

export function ProductDetailPage({slug}: {slug: string}) {
  const t = useTranslations("catalog");
  const common = useTranslations("common");
  const locale = useLocale();
  const query = useProductBySlug(slug);
  const product = query.data;

  if (query.isPending) return <section className="page-wrap py-16"><div className="h-[32rem] animate-pulse rounded-3xl bg-muted" /></section>;
  if (query.isError || !product) {
    return (
      <section className="page-wrap py-16">
        <Link href="/products" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{common("back")}</Link>
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <h1 className="text-2xl font-semibold">{query.error instanceof ApiClientError && query.error.messageKey === "PRODUCT_NOT_FOUND" ? t("productNotFound") : t("loadError")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{query.isError ? common("unknownError") : t("productNotFound")}</p>
        </div>
      </section>
    );
  }

  const variants = product.variants ?? [];
  return (
    <section className="page-wrap py-12 sm:py-16">
      <Link href="/products" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{common("back")}</Link>
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex min-h-[26rem] items-end rounded-3xl bg-[radial-gradient(circle_at_30%_20%,theme(colors.primary/20),transparent_45%),linear-gradient(135deg,theme(colors.muted),theme(colors.background))] p-8">
          <span className="text-9xl font-semibold tracking-tighter text-foreground/10">{(product.name ?? "P").charAt(0).toUpperCase()}</span>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="eyebrow">{product.brand?.name ?? "PC"}</p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{product.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Star className="size-4 fill-amber-400 text-amber-400" />{formatRating(product.ratingAverage)} · {product.reviewCount ?? 0} {t("reviews")}</div>
          </div>
          <p className="leading-7 text-muted-foreground">{product.description ?? t("noDescription")}</p>
          <Card>
            <CardHeader><CardTitle>{t("variants")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {variants.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : variants.map((variant, index) => (
                <div key={variant.id ?? index} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                  <div><p className="font-medium">{variant.model ?? variant.sku ?? `${t("variants")} ${index + 1}`}</p><p className="text-sm text-muted-foreground">{variant.options?.map((option) => option.value ?? option.name).filter(Boolean).join(" · ")}</p></div>
                  <div className="text-right"><p className="font-semibold">{formatMoney(variant.listPrice, locale)}</p><Badge className={variant.quantity && variant.quantity > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}>{variant.quantity && variant.quantity > 0 ? <><Check className="mr-1 size-3" />{t("inStock")}</> : t("outOfStock")}</Badge></div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Button size="lg" className="w-full" disabled>{t("productDetails")} · {common("comingSoon")}</Button>
        </div>
      </div>
    </section>
  );
}
