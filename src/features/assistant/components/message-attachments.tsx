"use client";

import {Paperclip, X} from "lucide-react";
import Image from "next/image";
import {useTranslations} from "next-intl";

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
        return <div key={id} className={`inline-flex min-w-0 items-center gap-2 rounded-xl border border-border/80 bg-background/95 px-2.5 py-1.5 text-xs shadow-2xs transition hover:border-primary/35 ${onRemove ? "w-56 shrink-0" : "max-w-full"}`}>
          {product?.imageUrl ? <Image src={product.imageUrl} alt="" width={28} height={28} unoptimized className="size-7 shrink-0 rounded-md border border-border/50 bg-muted/20 object-contain p-0.5" /> : <Paperclip className="size-3.5 shrink-0 text-primary/70" />}
          {product ? <Link href={`/products/${encodeURIComponent(product.seoName)}`} target="_blank" rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate font-medium text-foreground hover:text-primary hover:underline">{product.name}</Link>
            : <span className="min-w-0 flex-1 truncate text-muted-foreground">{t("selectedProductFallback")}</span>}
          {onRemove ? <button type="button" className="shrink-0 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground" onClick={() => onRemove(id)} aria-label={`${t("removeProduct")}: ${product?.name ?? t("selectedProductFallback")}`}><X className="size-3.5" /></button> : null}
        </div>;
      })}
    </div>
  );
}
