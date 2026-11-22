"use client";

import {Paperclip, X} from "lucide-react";
import Image from "next/image";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {useProductsByIds} from "@/features/catalog/queries";
import {Link} from "@/i18n/navigation";

export function MessageAttachments({productIds = [], onRemove}: {productIds?: string[]; onRemove?: (id: string) => void}) {
  const t = useTranslations("assistant");
  const products = useProductsByIds(productIds);
  if (!productIds.length) return null;
  return (
    <div className={onRemove ? "mb-2 flex min-w-0 gap-2 overflow-x-auto pb-1" : "mt-2 flex min-w-0 flex-wrap gap-1.5"} aria-label={t("selectedProducts")}>
      {productIds.map((id) => {
        const product = products.data?.find((item) => item.id === id);
        return (
          <Badge key={id} variant="outline" className={`h-auto min-w-0 gap-2 rounded-xl border-border/80 bg-background/95 px-2.5 py-1.5 text-xs font-normal shadow-2xs transition hover:border-primary/35 ${onRemove ? "w-56 shrink-0" : "max-w-full"}`}>
            {product?.imageUrl ? <Image src={product.imageUrl} alt="" width={28} height={28} unoptimized className="size-7 shrink-0 rounded-md border border-border/50 bg-muted/20 object-contain p-0.5" /> : <Paperclip className="size-3.5 shrink-0 text-primary/70" />}
            {product ? <Link href={`/products/${encodeURIComponent(product.seoName)}`} target="_blank" rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate font-medium text-foreground hover:text-primary hover:underline">{product.name}</Link>
              : <span className="min-w-0 flex-1 truncate text-muted-foreground">{t("selectedProductFallback")}</span>}
            {onRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-5 shrink-0 rounded-full p-0 text-muted-foreground hover:text-foreground"
                onClick={() => onRemove(id)}
                aria-label={`${t("removeProduct")}: ${product?.name ?? t("selectedProductFallback")}`}
              >
                <X className="size-3.5" />
              </Button>
            ) : null}
          </Badge>
        );
      })}
    </div>
  );
}
