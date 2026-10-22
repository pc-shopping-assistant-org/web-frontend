"use client";

import {ChevronLeft, ChevronRight} from "lucide-react";
import {useTranslations} from "next-intl";
import Image from "next/image";
import {useCallback, useEffect, useRef, useState, type ReactNode} from "react";

import {cn} from "@/lib/utils";

export type GalleryImage = {id?: string; imageUrl?: string | null};

/** Thumbnails shown at once; the strip scrolls sideways to reach the rest instead of wrapping onto more rows. */
const VISIBLE_THUMBNAILS = 5;
const EDGE_TOLERANCE_PX = 2;

/**
 * One row of image thumbnails with previous/next buttons at its edges; the one with nothing further to reach is disabled, not hidden.
 * The chosen thumbnail is scrolled into view, so choosing from the big picture or the keyboard never leaves it hidden.
 */
export function ProductGalleryStrip({
  images,
  activeId,
  alt,
  onSelect,
  placeholder,
}: {
  images: readonly GalleryImage[];
  activeId?: string;
  alt: string;
  onSelect: (id: string | undefined) => void;
  placeholder: ReactNode;
}) {
  const t = useTranslations("catalog");
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > EDGE_TOLERANCE_PX);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - EDGE_TOLERANCE_PX);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure, images.length]);

  useEffect(() => {
    const active = trackRef.current?.querySelector<HTMLElement>("[aria-pressed='true']");
    active?.scrollIntoView({block: "nearest", inline: "nearest", behavior: "smooth"});
  }, [activeId]);

  const page = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (track) track.scrollBy({left: direction * track.clientWidth, behavior: "smooth"});
  };

  return (
    <div className="group/strip relative" role="group" aria-label={t("productGallery")}>
      <div
        ref={trackRef}
        onScroll={measure}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => {
          const active = activeId !== undefined && image.id === activeId;
          return (
            <button
              type="button"
              key={image.id ?? index}
              style={{flexBasis: `calc((100% - ${(VISIBLE_THUMBNAILS - 1) * 0.5}rem) / ${VISIBLE_THUMBNAILS})`}}
              className={cn(
                "relative aspect-square shrink-0 snap-start overflow-hidden rounded-md border bg-muted/20 transition",
                active ? "border-primary ring-1 ring-primary" : "hover:border-primary/50",
              )}
              onClick={() => onSelect(image.id)}
              aria-label={`${t("viewImage")} ${index + 1}`}
              aria-pressed={active}
            >
              {image.imageUrl ? (
                <Image src={image.imageUrl} alt={alt} fill sizes="6rem" unoptimized className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center">{placeholder}</span>
              )}
            </button>
          );
        })}
      </div>
      <StripArrow side="left" enabled={canPrev} label={t("previousImages")} onClick={() => page(-1)} />
      <StripArrow side="right" enabled={canNext} label={t("nextImages")} onClick={() => page(1)} />
    </div>
  );
}

function StripArrow({side, enabled, label, onClick}: {side: "left" | "right"; enabled: boolean; label: string; onClick: () => void}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      disabled={!enabled}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 flex h-10 w-6 -translate-y-1/2 items-center justify-center bg-black/45 text-white transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:bg-black/20 disabled:text-white/50 disabled:hover:bg-black/20",
        side === "left" ? "left-0 rounded-r-md" : "right-0 rounded-l-md",
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}
