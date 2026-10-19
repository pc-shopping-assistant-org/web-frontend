"use client";

import {ImagePlus, LoaderCircle, X} from "lucide-react";
import Image from "next/image";
import {useTranslations} from "next-intl";
import {useEffect, useRef, useState, type ChangeEvent} from "react";

import {ErrorMessage} from "@/components/ui/error-message";
import type {ProductImage} from "@/features/catalog/models";
import {cn} from "@/lib/utils";

import {useUploadAdminFile} from "./queries";

/** One gallery entry while a product form is being edited; `url` is only known for stored or just uploaded files. */
export type GalleryItem = {fileId: string; url?: string; main: boolean};

export function galleryFromProduct(images: ProductImage[]): GalleryItem[] {
  return images.map((image) => ({fileId: image.fileId, url: image.imageUrl, main: image.main}));
}

/** The request form of the gallery; the first image becomes the main one when none was picked. */
export function galleryRequest(items: GalleryItem[]) {
  const hasMain = items.some((item) => item.main);
  return items.map((item, index) => ({fileId: item.fileId, main: hasMain ? item.main : index === 0}));
}

/** Most pictures a product can have; the first one uploaded is its cover. */
export const MAX_GALLERY_IMAGES = 9;

/**
 * The pictures of a product as a row of squares and one tile to add more. The cover is the first square; another
 * picture becomes the cover by moving to the front.
 */
export function ProductGalleryEditor({id, items, onChange}: {id: string; items: GalleryItem[]; onChange: (items: GalleryItem[]) => void}) {
  const t = useTranslations("admin");
  const upload = useUploadAdminFile();
  const [error, setError] = useState<unknown>(null);
  /** The uploads of one choice finish one after another, so each must add to the list as it is now, not as it was. */
  const latest = useRef(items);
  useEffect(() => {
    latest.current = items;
  }, [items]);
  const mainId = items.find((item) => item.main)?.fileId ?? items[0]?.fileId;
  const room = MAX_GALLERY_IMAGES - items.length;

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(room, 0));
    event.target.value = "";
    setError(null);
    for (const file of files) {
      try {
        const uploaded = await upload.mutateAsync(file);
        if (!uploaded.id || latest.current.some((item) => item.fileId === uploaded.id)) continue;
        const next = [...latest.current, {fileId: uploaded.id, url: uploaded.publicUrl, main: latest.current.length === 0}];
        latest.current = next;
        onChange(next);
      } catch (uploadError) {
        setError(uploadError);
        return;
      }
    }
  }
  function remove(fileId: string) {
    const rest = items.filter((item) => item.fileId !== fileId);
    onChange(rest.some((item) => item.main) || rest.length === 0 ? rest : rest.map((item, index) => ({...item, main: index === 0})));
  }
  function makeCover(fileId: string) {
    const chosen = items.find((item) => item.fileId === fileId);
    if (!chosen) return;
    onChange([{...chosen, main: true}, ...items.filter((item) => item.fileId !== fileId).map((item) => ({...item, main: false}))]);
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div>
        <p className="text-base font-semibold">{t("gallery")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("galleryDescription")}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => {
          const cover = mainId === item.fileId;
          return (
            <div key={item.fileId} className="group relative size-28 overflow-hidden rounded-lg border bg-muted">
              {item.url ? <Image src={item.url} alt="" fill sizes="112px" unoptimized className="object-cover" /> : null}
              {cover ? (
                <span className="absolute inset-x-0 bottom-0 bg-primary/90 py-1 text-center text-xs font-medium text-primary-foreground">
                  {t("mainImage")}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(item.fileId)}
                  className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-medium text-white opacity-0 transition focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  {t("makeCover")}
                </button>
              )}
              <button
                type="button"
                aria-label={t("removeImage")}
                onClick={() => remove(item.fileId)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
        {room > 0 ? (
          <label
            htmlFor={id}
            className={cn(
              "flex size-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-background px-2 text-center text-xs font-medium text-primary transition hover:border-primary/60 hover:bg-primary/5 focus-within:ring-2 focus-within:ring-ring",
              upload.isPending && "cursor-wait opacity-70",
            )}
          >
            {upload.isPending ? <LoaderCircle className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
            {upload.isPending ? t("uploading") : t("addImageTile", {count: items.length, max: MAX_GALLERY_IMAGES})}
            <input
              id={id}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={upload.isPending}
              onChange={(event) => void pick(event)}
            />
          </label>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{t("fileTypes")}</p>
      {error ? <ErrorMessage error={error} /> : null}
    </div>
  );
}
