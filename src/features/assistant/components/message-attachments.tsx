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
    <div className={onRemove ? "flex min-w-0 gap-2 overflow-x-auto pb-2" : "mt-2 flex min-w-0 flex-wrap gap-2"} aria-label={t("selectedProducts")}>
      {productIds.map((id) => {
        const product = products.data?.find((item) => item.id === id);
        return <div key={id} className={`inline-flex min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs ${onRemove ? "w-56 shrink-0" : "max-w-full"}`}>
          {product?.imageUrl ? <Image src={product.imageUrl} alt="" width={32} height={32} unoptimized className="size-8 shrink-0 rounded-md object-contain" /> : <Paperclip className="size-4 shrink-0 text-muted-foreground" />}
          {product ? <Link href={`/products/${encodeURIComponent(product.seoName)}`} target="_blank" rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate font-medium text-foreground hover:underline">{product.name}</Link>
            : <span className="min-w-0 flex-1 truncate text-muted-foreground">{t("selectedProductFallback")}</span>}
          {onRemove ? <button type="button" className="shrink-0 rounded-full p-1 hover:bg-muted" onClick={() => onRemove(id)} aria-label={`${t("removeProduct")}: ${product?.name ?? t("selectedProductFallback")}`}><X className="size-3.5" /></button> : null}
        </div>;
      })}
    </div>
  );
}
