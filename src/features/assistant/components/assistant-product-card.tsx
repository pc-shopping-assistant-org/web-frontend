"use client";

import {
  IconArrowUpRight,
  IconCheck,
  IconEye,
  IconLoader2,
  IconShoppingCart,
  IconSparkles,
} from "@tabler/icons-react";
import Image from "next/image";
import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Link} from "@/i18n/navigation";
import {getProductById, getProductBySlug} from "@/features/catalog/api";
import {CatalogCategoryIcon} from "@/features/catalog/components/catalog-category-icon";
import {useAddToCart} from "@/features/cart/queries";
import {formatMoney} from "@/lib/format";
import {ResourceStatus} from "@/lib/domain/catalog-enums";
import type {AssistantProduct} from "../models";
import {formatSpecLabel, formatSpecValue} from "../mappers";
import {ProductQuickViewDialog} from "./product-quick-view-dialog";

export function AssistantProductCard({
  product,
  onAskAboutProduct,
}: {
  product: AssistantProduct;
  onAskAboutProduct?: (productId: string) => void;
}) {
  const t = useTranslations("assistant");
  const catalogT = useTranslations("catalog");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const addToCart = useAddToCart();

  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const id = product.id || product.product_id;
  const slug = product.seo_name;
  const specs = Object.entries(product.specifications ?? {}).slice(0, 3);

  async function handleQuickAdd() {
    if ((!slug && !id) || addToCart.isPending || quickAddLoading) return;
    setQuickAddLoading(true);
    try {
      const detail = slug ? await getProductBySlug(slug) : await getProductById(id!);
      const activeVariants = (detail.variants ?? []).filter(
        (v) => !v.status || v.status === ResourceStatus.Active
      );
      if (activeVariants.length !== 1 || activeVariants[0].quantity <= 0) {
        // Multiple variants or out of stock: open quick view so user can choose or view
        setQuickViewOpen(true);
        return;
      }
      await addToCart.mutateAsync({productVariantId: activeVariants[0].id, quantity: 1});
      setAdded(true);
      setTimeout(() => setAdded(false), 2600);
    } catch {
      // open dialog on error as fallback
      setQuickViewOpen(true);
    } finally {
      setQuickAddLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col justify-between overflow-hidden rounded-xl border bg-background transition hover:border-primary/40 hover:shadow-md">
        {/* Top: Image + Info */}
        <div>
          <div className="flex gap-3 border-b bg-muted/15 p-3.5">
            <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background border text-primary/50">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="64px"
                  unoptimized
                  className="object-contain p-1.5"
                />
              ) : (
                <CatalogCategoryIcon
                  categoryName={product.name}
                  className="size-7 text-primary/65"
                  strokeWidth={1.45}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</p>
                <Badge variant="outline" className="text-[10px] shrink-0 text-emerald-600 border-emerald-300">
                  {catalogT("inStock")}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {product.description ?? "—"}
              </p>
            </div>
          </div>

          {/* Middle: Price + Specs */}
          <div className="space-y-2.5 p-3.5">
            <div className="text-base font-bold text-primary">
              {product.list_price != null ? formatMoney(product.list_price, locale) : "—"}
            </div>
            {specs.length > 0 && (
              <dl className="space-y-1 text-xs text-muted-foreground border-t pt-2">
                {specs.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <dt className="truncate">{formatSpecLabel(key)}</dt>
                    <dd className="max-w-[60%] truncate font-medium text-foreground text-right">
                      {formatSpecValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {/* Bottom: Action Bar */}
        <div className="border-t bg-muted/10 p-2.5 flex flex-wrap items-center gap-1.5">
          {/* Quick Add Button */}
          <Button
            size="sm"
            onClick={handleQuickAdd}
            disabled={quickAddLoading || addToCart.isPending}
            className="h-8 flex-1 min-w-[110px] gap-1.5 text-xs font-semibold"
          >
            {added ? (
              <>
                <IconCheck className="size-3.5 text-emerald-300" />
                <span>{commonT("saved")}</span>
              </>
            ) : quickAddLoading || addToCart.isPending ? (
              <>
                <IconLoader2 className="size-3.5 animate-spin" />
                <span>{catalogT("addingToCart")}</span>
              </>
            ) : (
              <>
                <IconShoppingCart className="size-3.5" />
                <span>{catalogT("quickAdd")}</span>
              </>
            )}
          </Button>

          {/* Quick View Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickViewOpen(true)}
            title={catalogT("productDetails")}
            className="h-8 px-2.5 text-xs gap-1"
          >
            <IconEye className="size-3.5" />
            <span className="hidden sm:inline">{commonT("preview")}</span>
          </Button>

          {/* External Detail Page Link (New tab) */}
          {slug && (
            <Link
              href={`/products/${encodeURIComponent(slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              title={t("viewProduct")}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border bg-background px-2.5 text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition"
            >
              <span>{t("viewProduct")}</span>
              <IconArrowUpRight className="size-3.5" />
            </Link>
          )}

          {/* Ask about product */}
          {id && (
            onAskAboutProduct ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAskAboutProduct(id)}
                title={t("askAboutProduct")}
                className="h-8 px-2 text-xs text-primary hover:bg-primary/10"
              >
                <IconSparkles className="size-3.5" />
              </Button>
            ) : (
              <Link
                href={`/assistant?productId=${encodeURIComponent(id)}`}
                title={t("askAboutProduct")}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 px-2 text-xs text-primary hover:bg-primary/10 transition"
              >
                <IconSparkles className="size-3.5" />
              </Link>
            )
          )}
        </div>
      </div>

      {/* Quick View Dialog */}
      {quickViewOpen && (
        <ProductQuickViewDialog
          productId={id}
          seoName={slug}
          open={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
        />
      )}
    </>
  );
}
