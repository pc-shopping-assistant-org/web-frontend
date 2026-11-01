"use client";

import {IconCheck, IconExternalLink, IconLoader2, IconShoppingCart} from "@tabler/icons-react";
import Image from "next/image";
import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";
import {useQuery} from "@tanstack/react-query";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Link} from "@/i18n/navigation";
import {getProductById, getProductBySlug} from "@/features/catalog/api";
import {useAddToCart} from "@/features/cart/queries";
import {formatMoney} from "@/lib/format";
import {ResourceStatus} from "@/lib/domain/catalog-enums";
import {formatSpecLabel, formatSpecValue} from "../mappers";

export function ProductQuickViewDialog({
  productId,
  seoName,
  open,
  onClose,
}: {
  productId?: string;
  seoName?: string;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("assistant");
  const catalogT = useTranslations("catalog");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const addToCart = useAddToCart();

  const productKey = seoName || productId;
  const productQuery = useQuery({
    queryKey: ["catalog", "quick-view", seoName, productId],
    queryFn: () => (seoName ? getProductBySlug(seoName) : getProductById(productId!)),
    enabled: open && Boolean(productKey),
    staleTime: 60_000,
  });

  const detail = productQuery.data ?? null;
  const loading = productQuery.isLoading;

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  function handleClose() {
    setSelectedVariantId(null);
    setSelectedImageUrl(null);
    setAdded(false);
    onClose();
  }

  const activeVariants = (detail?.variants ?? []).filter(
    (v) => !v.status || v.status === ResourceStatus.Active
  );
  const defaultVar = activeVariants.find((v) => v.quantity > 0) ?? activeVariants[0];
  const currentVariant = activeVariants.find((v) => v.id === selectedVariantId) ?? defaultVar;
  const targetVariantId = currentVariant?.id ?? defaultVar?.id ?? null;
  const isOutOfStock = !currentVariant || currentVariant.quantity <= 0;
  const price = currentVariant ? currentVariant.price : detail?.variants?.[0]?.price;
  const displayImageUrl = selectedImageUrl ?? detail?.imageUrl ?? detail?.images?.[0]?.imageUrl ?? null;

  async function handleAddToCart() {
    if (!targetVariantId || isOutOfStock || addToCart.isPending) return;
    try {
      await addToCart.mutateAsync({productVariantId: targetVariantId, quantity: 1});
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch {
      // error handled by react-query
    }
  }

  const specs = Object.entries(detail?.specifications ?? {});

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={detail?.name ?? t("viewProduct")}
      description={detail?.brand?.name ? `${detail.brand.name} • ${detail.category?.name ?? ""}` : undefined}
      closeLabel={commonT("close")}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
      footer={
        <div className="flex w-full items-center justify-between gap-3 pt-2">
          {detail?.seoName ? (
            <Link
              href={`/products/${encodeURIComponent(detail.seoName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition"
            >
              {catalogT("productDetails")}
              <IconExternalLink className="size-3.5" />
            </Link>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>
              {commonT("close")}
            </Button>
            <Button
              size="sm"
              disabled={isOutOfStock || addToCart.isPending || !targetVariantId}
              onClick={handleAddToCart}
              className="min-w-36 gap-1.5"
            >
              {added ? (
                <>
                  <IconCheck className="size-4 text-emerald-300" />
                  <span>{commonT("saved")}</span>
                </>
              ) : addToCart.isPending ? (
                <>
                  <IconLoader2 className="size-4 animate-spin" />
                  <span>{catalogT("addingToCart")}</span>
                </>
              ) : isOutOfStock ? (
                <span>{catalogT("outOfStock")}</span>
              ) : (
                <>
                  <IconShoppingCart className="size-4" />
                  <span>{catalogT("quickAdd")}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <IconLoader2 className="size-8 animate-spin text-primary/60" />
        </div>
      ) : detail ? (
        <div className="space-y-5 pt-2">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted/20 p-2">
                {displayImageUrl ? (
                  <Image
                    src={displayImageUrl}
                    alt={detail.name}
                    fill
                    sizes="300px"
                    unoptimized
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    {t("noImage")}
                  </div>
                )}
              </div>
              {detail.images && detail.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {detail.images
                    .filter((img): img is typeof img & {imageUrl: string} => Boolean(img.imageUrl))
                    .map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedImageUrl(img.imageUrl)}
                        className={`relative size-14 shrink-0 overflow-hidden rounded-lg border transition ${
                          displayImageUrl === img.imageUrl
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border/60 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <Image src={img.imageUrl} alt="" fill sizes="56px" unoptimized className="object-cover" />
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={isOutOfStock ? "outline" : "secondary"}
                    className={
                      isOutOfStock
                        ? "border-muted-foreground/30 text-muted-foreground"
                        : "border-emerald-500/30 text-emerald-700 bg-emerald-50"
                    }
                  >
                    {isOutOfStock ? catalogT("outOfStock") : catalogT("inStock")}
                  </Badge>
                  {detail.brand?.name && (
                    <span className="text-xs text-muted-foreground">{detail.brand.name}</span>
                  )}
                </div>
                <h3 className="mt-2 text-lg font-semibold leading-snug">{detail.name}</h3>
                <div className="mt-3 text-2xl font-bold text-primary">
                  {price != null ? formatMoney(price, locale) : "—"}
                </div>
              </div>

              {/* Variants */}
              {activeVariants.length > 1 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {catalogT("variants")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeVariants.map((v) => {
                      const label = v.options?.map((o) => o.value).join(" / ") || v.sku || "Variant";
                      const isSelected = v.id === targetVariantId;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-background hover:border-primary/50 text-foreground"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {detail.description && (
                <p className="line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                  {detail.description}
                </p>
              )}
            </div>
          </div>

          {/* Specifications */}
          {specs.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("specification")}
              </h4>
              <div className="max-h-52 overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0">
                    <TableRow>
                      <TableHead className="px-3 py-2 h-8 text-xs text-muted-foreground">{t("specName")}</TableHead>
                      <TableHead className="px-3 py-2 h-8 text-xs text-muted-foreground text-right">{t("specValue")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specs.map(([k, v]) => (
                      <TableRow key={k} className="text-xs">
                        <TableCell className="px-3 py-1.5 text-muted-foreground font-medium whitespace-normal">
                          {formatSpecLabel(k)}
                        </TableCell>
                        <TableCell className="px-3 py-1.5 text-right font-medium text-foreground max-w-[50%] truncate">
                          {formatSpecValue(v)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
          {catalogT("productNotFound")}
        </div>
      )}
    </Dialog>
  );
}
