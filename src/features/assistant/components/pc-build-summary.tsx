"use client";

import {
  IconArrowUpRight,
  IconCheck,
  IconCpu,
  IconLoader2,
  IconShieldCheck,
  IconShoppingCart,
} from "@tabler/icons-react";
import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Link} from "@/i18n/navigation";
import {useAddToCart} from "@/features/cart/queries";
import {formatMoney} from "@/lib/format";
import type {AssistantProduct, ChatData} from "../models";
import {ProductQuickViewDialog} from "./product-quick-view-dialog";

type PcBuildData = NonNullable<NonNullable<ChatData["stateful"]>["build"]>;


export function PcBuildSummary({build, products = []}: {build: PcBuildData; products?: AssistantProduct[]}) {
  const t = useTranslations("assistant.build");
  const locale = useLocale();
  const addToCart = useAddToCart();

  const [addingAll, setAddingAll] = useState(false);
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [quickViewTarget, setQuickViewTarget] = useState<{productId?: string; seoName?: string; variantId?: string} | null>(null);

  const purchaseableParts = build.parts.filter(
    (part) => Boolean(part.variantId) && !part.owned
  );

  async function handleAddAllToCart() {
    if (purchaseableParts.length === 0 || addingAll) return;
    setAddingAll(true);
    setAddedCount(0);

    let success = 0;
    for (const part of purchaseableParts) {
      if (!part.variantId) continue;
      try {
        await addToCart.mutateAsync({productVariantId: part.variantId, quantity: 1});
        success += 1;
        setAddedCount(success);
      } catch {
        // continue adding remaining parts even if one encounters an error
      }
    }
    setAddingAll(false);
    setTimeout(() => setAddedCount(null), 3500);
  }

  return (
    <Card className="overflow-hidden border-primary/30 shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <IconCpu className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base font-bold sm:text-lg">
                {t("title")}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-50 text-emerald-700 text-xs gap-1">
              <IconShieldCheck className="size-3.5" />
              {t("compatible")}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Parts Table */}
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader className="bg-muted/40 text-xs font-semibold text-muted-foreground">
              <TableRow>
                <TableHead className="px-4 py-2.5 h-9">{t("colSlot")}</TableHead>
                <TableHead className="px-4 py-2.5 h-9">{t("colProduct")}</TableHead>
                <TableHead className="px-4 py-2.5 h-9 text-right">{t("colPrice")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {build.parts.map((part, index) => {
                const slotLabel = t.has(`slots.${part.slot}`) ? t(`slots.${part.slot}`) : part.slot;
                const matchedProduct = products.find((p) => p.name.toLowerCase() === part.name.toLowerCase());
                const canQuickView = Boolean(part.variantId || matchedProduct?.id || matchedProduct?.product_id || matchedProduct?.seo_name);
                return (
                  <TableRow key={`${part.slot}-${index}`}>
                    <TableCell className="whitespace-nowrap px-4 py-3 font-semibold text-xs text-muted-foreground">
                      {slotLabel}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {canQuickView ? (
                          <button
                            type="button"
                            onClick={() =>
                              setQuickViewTarget({
                                productId: matchedProduct?.id || matchedProduct?.product_id,
                                seoName: matchedProduct?.seo_name,
                                variantId: part.variantId ?? undefined,
                              })
                            }
                            className="group inline-flex items-center gap-1 text-left font-medium text-foreground leading-snug transition hover:text-primary hover:underline"
                          >
                            <span>{part.name}</span>
                            <IconArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                          </button>
                        ) : (
                          <Link
                            href={`/products?keyword=${encodeURIComponent(part.name)}`}
                            className="group inline-flex items-center gap-1 font-medium text-foreground leading-snug transition hover:text-primary hover:underline"
                          >
                            <span>{part.name}</span>
                            <IconArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                          </Link>
                        )}
                        {part.owned && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {t("owned")}
                          </Badge>
                        )}
                        {part.pinned && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {t("pinned")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right font-semibold text-primary">
                      {formatMoney(part.owned ? 0 : part.spending, locale)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Footer Summary & Add All CTA */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-primary/5 p-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {t("total")}
            </span>
            <div className="text-2xl font-black text-primary tracking-tight">
              {formatMoney(build.totalSpending, locale)}
            </div>
            {purchaseableParts.length < build.parts.length && (
              <span className="text-xs text-muted-foreground">
                {t("ownedExcluded", {count: build.parts.length - purchaseableParts.length})}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/build-pc"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-background px-4 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary sm:text-sm"
            >
              <span>{t("openBuilder")}</span>
              <IconArrowUpRight className="size-4" />
            </Link>
            <Button
              size="lg"
              onClick={handleAddAllToCart}
              disabled={addingAll || purchaseableParts.length === 0}
              className="h-11 min-w-56 gap-2 font-bold shadow-sm"
            >
              {addedCount !== null && !addingAll ? (
                <>
                  <IconCheck className="size-5 text-emerald-300" />
                  <span>{t("added", {count: addedCount})}</span>
                </>
              ) : addingAll ? (
                <>
                  <IconLoader2 className="size-5 animate-spin" />
                  <span>{t("adding", {done: addedCount ?? 0, total: purchaseableParts.length})}</span>
                </>
              ) : (
                <>
                  <IconShoppingCart className="size-5" />
                  <span>{t("addAll")}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
      {quickViewTarget ? (
        <ProductQuickViewDialog
          productId={quickViewTarget.productId}
          seoName={quickViewTarget.seoName}
          variantId={quickViewTarget.variantId}
          open={Boolean(quickViewTarget)}
          onClose={() => setQuickViewTarget(null)}
        />
      ) : null}
    </Card>
  );
}
