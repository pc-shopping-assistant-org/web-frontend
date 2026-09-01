"use client";

import { FileImage, LoaderCircle, Upload, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Label } from "@/components/ui/label";
import type {FileResponse} from "@/features/admin/contracts/responses";

import { useUploadAdminFile } from "./queries";

export type UploadedFile = FileResponse;

type FileUploadFieldProps = {
  id: string;
  label: string;
  multiple?: boolean;
  currentFileId?: string;
  value?: UploadedFile[];
  selectedMainId?: string;
  onUploaded: (file: UploadedFile) => void;
  onSelectMain?: (fileId: string) => void;
  onRemove?: (fileId?: string) => void;
};

/**
 * Uploads media first and returns the persisted file metadata to the owning
 * form. Product/variant/profile mutations then reference the returned ID,
 * keeping the existing transactional JSON contracts intact.
 */
export function FileUploadField({
  id,
  label,
  multiple = false,
  currentFileId,
  value = [],
  selectedMainId,
  onUploaded,
  onRemove,
  onSelectMain,
}: FileUploadFieldProps) {
  const t = useTranslations("admin");
  const upload = useUploadAdminFile();
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [error, setError] = useState<unknown>(null);
  const previewsRef = useRef(previews);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(
    () => () => {
      Object.values(previewsRef.current).forEach((url) =>
        URL.revokeObjectURL(url),
      );
    },
    [],
  );

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setError(null);
    for (const file of multiple ? files : files.slice(0, 1)) {
      const preview = URL.createObjectURL(file);
      try {
        const uploaded = await upload.mutateAsync(file);
        if (uploaded.id) {
          setPreviews((current) => ({ ...current, [uploaded.id!]: preview }));
        } else {
          URL.revokeObjectURL(preview);
        }
        onUploaded(uploaded);
      } catch (uploadError) {
        URL.revokeObjectURL(preview);
        setError(uploadError);
      }
    }
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={id}>{label}</Label>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-sm transition hover:border-primary/50 hover:bg-primary/5"
      >
        <span className="flex min-w-0 items-center gap-3">
          {upload.isPending ? (
            <LoaderCircle className="size-4 shrink-0 animate-spin text-primary" />
          ) : (
            <Upload className="size-4 shrink-0 text-primary" />
          )}
          <span className="min-w-0">
            <span className="block font-medium">
              {upload.isPending ? t("uploading") : t("chooseImage")}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {t("fileTypes")}
            </span>
          </span>
        </span>
        <span className="shrink-0 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium">
          {t("browseFiles")}
        </span>
      </label>
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={multiple}
        className="sr-only"
        onChange={(event) => void handleChange(event)}
        disabled={upload.isPending}
      />
      {currentFileId ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
          <span className="truncate text-muted-foreground">
            {t("currentFile")}: {currentFileId}
          </span>
          {onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("removeFile")}
              onClick={() => onRemove(currentFileId)}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      ) : null}
      {value.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {value.map((file) => (
            <div
              key={file.id ?? file.originalName}
              className="flex items-center gap-3 rounded-lg border bg-background p-2"
            >
              {file.id && previews[file.id] ? (
                // The object URL is local to the current browser session and
                // avoids requiring a second request before the form submits.
                <Image
                  src={previews[file.id]}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="size-12 rounded-md object-cover"
                />
              ) : (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <FileImage className="size-5" aria-hidden="true" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {file.originalName ?? file.id}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {file.id}
                </span>
              </span>
              {onSelectMain && file.id ? (
                <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <input
                    type="radio"
                    name={`${id}-main`}
                    checked={selectedMainId === file.id}
                    onChange={() => onSelectMain(file.id!)}
                  />
                  {t("mainImage")}
                </label>
              ) : null}
              {onRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("removeFile")}
                  onClick={() => onRemove(file.id)}
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {error ? <ErrorMessage error={error} /> : null}
    </div>
  );
}
