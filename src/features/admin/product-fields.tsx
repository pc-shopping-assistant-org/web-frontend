"use client";

import { Plus, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductImage } from "@/features/catalog/models";

import { FileUploadField, type UploadedFile } from "./file-upload";

/** One gallery entry while a product form is being edited; `url` is only known for stored or just uploaded files. */
export type GalleryItem = { fileId: string; url?: string; main: boolean };
export type OptionRow = { name: string; value: string };

export function galleryFromProduct(images: ProductImage[]): GalleryItem[] {
  return images.map((image) => ({ fileId: image.fileId, url: image.imageUrl, main: image.main }));
}

/** The request form of the gallery; the first image becomes the main one when none was picked. */
export function galleryRequest(items: GalleryItem[]) {
  const hasMain = items.some((item) => item.main);
  return items.map((item, index) => ({ fileId: item.fileId, main: hasMain ? item.main : index === 0 }));
}

/** Options with an empty name and value are dropped; the backend rejects half-filled ones. */
export function optionsRequest(rows: OptionRow[]) {
  return rows
    .map((row) => ({ name: row.name.trim(), value: row.value.trim() }))
    .filter((row) => row.name || row.value);
}

export function ProductGalleryEditor({
  id,
  items,
  onChange,
}: {
  id: string;
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
}) {
  const t = useTranslations("admin");
  const mainId = items.find((item) => item.main)?.fileId ?? items[0]?.fileId;

  function add(file: UploadedFile) {
    if (items.some((item) => item.fileId === file.id)) return;
    onChange([...items, { fileId: file.id, url: file.publicUrl, main: items.length === 0 }]);
  }
  function remove(fileId: string) {
    const rest = items.filter((item) => item.fileId !== fileId);
    onChange(rest.some((item) => item.main) || rest.length === 0 ? rest : rest.map((item, index) => ({ ...item, main: index === 0 })));
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div>
        <p className="text-sm font-medium">{t("gallery")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("galleryDescription")}</p>
      </div>
      {items.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.fileId} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.url ? (
                  <Image src={item.url} alt="" fill sizes="48px" unoptimized className="object-cover" />
                ) : null}
              </div>
              <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="radio"
                  name={`${id}-main`}
                  checked={mainId === item.fileId}
                  onChange={() =>
                    onChange(items.map((entry) => ({ ...entry, main: entry.fileId === item.fileId })))
                  }
                />
                {mainId === item.fileId ? t("mainImage") : t("galleryImage")}
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("removeFile")}
                onClick={() => remove(item.fileId)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
          {t("noImages")}
        </p>
      )}
      <FileUploadField id={id} label={t("addImages")} multiple onUploaded={add} />
    </div>
  );
}

/** Free-form `name: value` rows such as Color: Blue. */
export function VariantOptionsEditor({
  id,
  rows,
  onChange,
}: {
  id: string;
  rows: OptionRow[];
  onChange: (rows: OptionRow[]) => void;
}) {
  const t = useTranslations("admin");
  const update = (index: number, patch: Partial<OptionRow>) =>
    onChange(rows.map((row, position) => (position === index ? { ...row, ...patch } : row)));
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={`${id}-0-name`}>{t("options")}</Label>
      <p className="text-xs text-muted-foreground">{t("optionTypeHint")}</p>
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            id={`${id}-${index}-name`}
            aria-label={t("optionName")}
            placeholder={t("optionName")}
            value={row.name}
            onChange={(event) => update(index, { name: event.target.value })}
          />
          <Input
            id={`${id}-${index}-value`}
            aria-label={t("optionValue")}
            placeholder={t("optionValue")}
            value={row.value}
            onChange={(event) => update(index, { value: event.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("removeOption")}
            onClick={() => onChange(rows.filter((_, position) => position !== index))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, { name: "", value: "" }])}>
        <Plus className="size-4" />
        {t("addOption")}
      </Button>
    </div>
  );
}
