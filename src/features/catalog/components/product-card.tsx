import {ArrowUpRight, Star} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Link} from "@/i18n/navigation";
import type {ProductSummary} from "@/lib/api/types";
import {formatMoney, formatRating} from "@/lib/format";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";

export function ProductCard({product}: {product: ProductSummary}) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const name = product.name ?? t("productNotFound");
  const slug = product.seoName ?? product.id ?? "";
  const price = product.minPrice ?? product.maxPrice;

  return (
    <Card className="group overflow-hidden border-border/70 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex h-44 items-end justify-between bg-[radial-gradient(circle_at_20%_20%,theme(colors.primary/15),transparent_45%),linear-gradient(135deg,theme(colors.muted),theme(colors.background))] p-5">
        <span className="text-6xl font-semibold tracking-tighter text-foreground/10">{name.charAt(0).toUpperCase()}</span>
        {product.status === "ACTIVE" ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{t("inStock")}</Badge> : null}
      </div>
      <CardContent className="flex min-h-48 flex-col gap-3 p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{product.brandName ?? "PC"}</p>
          <h3 className="line-clamp-2 text-lg font-semibold tracking-tight">{name}</h3>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("from")}</p>
            <p className="text-lg font-semibold">{formatMoney(price, locale)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {formatRating(product.ratingAverage)} · {product.reviewCount ?? 0} {t("reviews")}
            </p>
          </div>
          <Link href={`/products/${slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {t("productDetails")} <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
