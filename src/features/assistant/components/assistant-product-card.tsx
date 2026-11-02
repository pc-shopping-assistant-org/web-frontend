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
      <div data-product-card className="group flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all hover:border-primary/35 hover:shadow-md">
        {/* Top: Image + Info */}
        <div>
          <div className="flex gap-3 p-3.5">
            <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/25 text-primary/60">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="64px"
                  unoptimized
                  className="object-contain p-1.5 transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <CatalogCategoryIcon
                  categoryName={product.name}
                  className="size-7 text-primary/70"
                  strokeWidth={1.45}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{product.name}</p>
              </div>
              {product.description ? (
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {product.description}
                </p>
              ) : null}
              <div className="mt-1.5 text-sm font-bold tracking-tight text-primary">
                {product.list_price != null ? formatMoney(product.list_price, locale) : "—"}
              </div>
            </div>
          </div>

          {/* Middle: Specs */}
          {specs.length > 0 && (
            <div className="px-3.5 pb-3">
              <dl className="space-y-1 rounded-xl bg-muted/35 px-2.5 py-2 text-xs text-muted-foreground">
                {specs.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <dt className="truncate">{formatSpecLabel(key)}</dt>
                    <dd className="max-w-[60%] truncate text-right font-medium text-foreground">
                      {formatSpecValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Bottom: Action Bar */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 bg-muted/15 p-2.5">
          {/* Quick Add Button */}
          <Button
            size="sm"
            onClick={handleQuickAdd}
            disabled={quickAddLoading || addToCart.isPending}
            className="h-8 min-w-[110px] flex-1 gap-1.5 rounded-lg text-xs font-semibold shadow-2xs"
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
            className="h-8 gap-1 rounded-lg px-2.5 text-xs"
          >
            <IconEye className="size-3.5" />
            <span className="hidden sm:inline">{catalogT("productDetails")}</span>
          </Button>

          {/* External Detail Page Link (New tab) */}
          {slug && (
            <Link
              href={`/products/${encodeURIComponent(slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              title={t("viewProduct")}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-medium text-muted-foreground no-underline transition hover:border-primary/40 hover:text-primary"
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
                className="h-8 rounded-lg px-2 text-xs text-primary hover:bg-primary/10"
              >
                <IconSparkles className="size-3.5" />
              </Button>
            ) : (
              <Link
                href={`/assistant?productId=${encodeURIComponent(id)}`}
                title={t("askAboutProduct")}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 px-2 text-xs text-primary no-underline transition hover:bg-primary/10"
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
