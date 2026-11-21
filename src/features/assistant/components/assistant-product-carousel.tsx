"use client";

import {IconChevronLeft, IconChevronRight} from "@tabler/icons-react";
import {useTranslations} from "next-intl";
import {useRef} from "react";

import {Button} from "@/components/ui/button";
import type {AssistantProduct} from "../models";
import {AssistantProductCard} from "./assistant-product-card";

const CAROUSEL_SCROLL_STEP_PX = 300;

export function AssistantProductCarousel({
  products,
  onAskAboutProduct,
}: {
  products: AssistantProduct[];
  onAskAboutProduct?: (productId: string) => void;
}) {
  const t = useTranslations("assistant");
  const trackRef = useRef<HTMLDivElement>(null);

  if (!products.length) return null;

  const isMulti = products.length > 1;

  function scrollByDirection(direction: -1 | 1) {
    trackRef.current?.scrollBy({
      left: direction * CAROUSEL_SCROLL_STEP_PX,
      behavior: "smooth",
    });
  }

  return (
    <div className="mt-3 border-t border-border/60 pt-3" data-product-cards>
      {isMulti ? (
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-muted-foreground">
            {t("relatedProducts")} ({products.length})
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => scrollByDirection(-1)}
              aria-label={t("scrollLeft")}
              className="size-7 rounded-lg"
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => scrollByDirection(1)}
              aria-label={t("scrollRight")}
              className="size-7 rounded-lg"
            >
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div
        ref={trackRef}
        className={
          isMulti
            ? "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1.5 scroll-smooth"
            : "grid max-w-[360px] grid-cols-1"
        }
      >
        {products.map((product) => (
          <div
            key={product.id ?? product.product_id ?? product.name}
            className={isMulti ? "flex w-[268px] shrink-0 snap-start sm:w-[288px]" : "flex min-w-0"}
          >
            <AssistantProductCard product={product} onAskAboutProduct={onAskAboutProduct} />
          </div>
        ))}
      </div>
    </div>
  );
}
