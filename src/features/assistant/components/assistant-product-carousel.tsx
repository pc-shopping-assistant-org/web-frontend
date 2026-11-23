"use client";

import {useTranslations} from "next-intl";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type {AssistantProduct} from "../models";
import {AssistantProductCard} from "./assistant-product-card";

export function AssistantProductCarousel({
  products,
  onAskAboutProduct,
  compact = false,
}: {
  products: AssistantProduct[];
  onAskAboutProduct?: (productId: string) => void;
  compact?: boolean;
}) {
  const t = useTranslations("assistant");

  if (!products.length) return null;

  if (products.length === 1) {
    const product = products[0];
    return (
      <div data-product-cards>
        <div className={compact ? "grid grid-cols-1" : "grid max-w-[360px] grid-cols-1"}>
          <AssistantProductCard
            product={product}
            onAskAboutProduct={onAskAboutProduct}
            compact={compact}
          />
        </div>
      </div>
    );
  }

  return (
    <Carousel
      opts={{align: "start", dragFree: true}}
      data-product-cards
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">
          {t("relatedProducts")} ({products.length})
        </p>
        <div className="flex items-center gap-1">
          <CarouselPrevious
            aria-label={t("scrollLeft")}
            className="static size-7 translate-y-0 rounded-lg"
          />
          <CarouselNext
            aria-label={t("scrollRight")}
            className="static size-7 translate-y-0 rounded-lg"
          />
        </div>
      </div>

      <CarouselContent className="-ml-2.5">
        {products.map((product) => (
          <CarouselItem
            key={product.id ?? product.product_id ?? product.name}
            className={compact ? "flex basis-[244px] pl-2.5" : "flex basis-[272px] pl-2.5 sm:basis-[292px]"}
          >
            <AssistantProductCard
              product={product}
              onAskAboutProduct={onAskAboutProduct}
              compact={compact}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
