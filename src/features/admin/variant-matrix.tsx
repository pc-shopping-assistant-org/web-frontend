"use client";

import {ImagePlus, LoaderCircle, Plus, Trash2, X} from "lucide-react";
import Image from "next/image";
import {useTranslations} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {cn} from "@/lib/utils";

import {useUploadAdminFile} from "./queries";
import {
  cellOf,
  MAX_VARIANT_GROUPS,
  newGroup,
  variantRows,
  withTrailingBlank,
  type VariantCell,
  type VariantGroup,
  type VariantMatrixState,
  type VariantProblem,
} from "./variant-matrix-model";

/**
 * The seller's way of describing variants: up to two groups ("Color", "Size") with their options, then one row of
 * price, stock and SKU for every combination. It only edits the state; the page turns that into variants.
 */
export function VariantMatrixEditor({
  value,
  onChange,
  problem,
  title,
  description,
  withSingle = true,
}: {
  value: VariantMatrixState;
  onChange: (next: VariantMatrixState) => void;
  problem?: VariantProblem | null;
  /** Replace the heading and its line of help, for a page where "Variants" is already the title of the card. */
  title?: string;
  description?: string;
  /** Offer the price and stock of a product without groups; off when the product already has its variants. */
  withSingle?: boolean;
}) {
  const t = useTranslations("admin.variantMatrix");
  const rows = variantRows(value);

  const setGroup = (id: string, patch: Partial<VariantGroup>) =>
    onChange({...value, groups: value.groups.map((group) => (group.id === id ? {...group, ...patch} : group))});
  const setCell = (key: string, patch: Partial<VariantCell>) =>
    onChange({...value, cells: {...value.cells, [key]: {...cellOf(value, key), ...patch}}});

  return (
    <section className="space-y-4 sm:col-span-2" aria-label={title ?? t("title")}>
      <div>
        <h3 className="text-base font-semibold">{title ?? t("title")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description ?? t("description")}</p>
      </div>

      {value.groups.map((group, index) => (
        <GroupCard
          key={group.id}
          index={index}
          group={group}
          onChange={(patch) => setGroup(group.id, patch)}
          onRemove={() => onChange({...value, groups: value.groups.filter((other) => other.id !== group.id)})}
        />
      ))}

      {value.groups.length < MAX_VARIANT_GROUPS ? (
        <div className="rounded-xl bg-muted/40 p-4">
          <Button
            type="button"
            variant="outline"
            className="border-dashed text-primary"
            onClick={() => onChange({...value, groups: [...value.groups, newGroup()]})}
          >
            <Plus className="size-4" />
            {t("addGroup", {n: value.groups.length + 1})}
          </Button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        withSingle ? (
          <SingleVariant cell={value.single} onChange={(patch) => onChange({...value, single: {...value.single, ...patch}})} />
        ) : null
      ) : (
        <VariantTable value={value} rows={rows} onChange={onChange} setCell={setCell} />
      )}

      {problem ? (
        <p role="alert" className="text-sm text-destructive">
          {t(`problem.${problem.code}`, {count: problem.code === "cells" ? problem.count : 0})}
        </p>
      ) : null}
    </section>
  );
}

function GroupCard({
  index,
  group,
  onChange,
  onRemove,
}: {
  index: number;
  group: VariantGroup;
  onChange: (patch: Partial<VariantGroup>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("admin.variantMatrix");
  const setText = (id: string, text: string) =>
    onChange({values: withTrailingBlank(group.values.map((value) => (value.id === id ? {...value, text} : value)))});
  return (
    <div className="relative space-y-4 rounded-xl bg-muted/40 p-4">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-3 top-3"
        aria-label={t("removeGroup", {n: index + 1})}
        onClick={onRemove}
      >
        <X className="size-4" />
      </Button>
      <div className="max-w-md space-y-2">
        <Label htmlFor={`variant-group-${group.id}`}>{t("groupLabel", {n: index + 1})}</Label>
        <Input
          id={`variant-group-${group.id}`}
          value={group.name}
          maxLength={100}
          placeholder={t("groupPlaceholder")}
          onChange={(event) => onChange({name: event.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label>
          {t("options")} <span className="text-destructive">*</span>
        </Label>
        <div className="grid gap-3 sm:grid-cols-2 sm:pr-10">
          {group.values.map((value, position) => {
            const last = position === group.values.length - 1 && !value.text.trim();
            return (
              <div key={value.id} className="flex items-center gap-2">
                <Input
                  value={value.text}
                  maxLength={255}
                  aria-label={t("optionLabel", {group: index + 1, n: position + 1})}
                  placeholder={t("optionPlaceholder")}
                  onChange={(event) => setText(value.id, event.target.value)}
                />
                {last ? (
                  <span className="size-8 shrink-0" aria-hidden="true" />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("removeOption", {name: value.text})}
                    onClick={() => onChange({values: withTrailingBlank(group.values.filter((other) => other.id !== value.id))})}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** A product with no groups sells as one variant. Leaving the price empty creates the product without any. */
function SingleVariant({cell, onChange}: {cell: VariantCell; onChange: (patch: Partial<VariantCell>) => void}) {
  const t = useTranslations("admin.variantMatrix");
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div>
        <p className="font-medium">{t("singleTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("singleDescription")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <CellFields id="variant-single" cell={cell} onChange={onChange} />
      </div>
    </div>
  );
}

export function CellFields({id, cell, onChange}: {id: string; cell: VariantCell; onChange: (patch: Partial<VariantCell>) => void}) {
  const t = useTranslations("admin.variantMatrix");
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${id}-price`}>{t("price")}</Label>
        <MoneyInput id={`${id}-price`} value={cell.price} onChange={(price) => onChange({price})} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-stock`}>{t("stock")}</Label>
        <Input
          id={`${id}-stock`}
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={cell.quantity}
          onChange={(event) => onChange({quantity: event.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-warranty`}>
          {t("warranty")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${id}-warranty`}
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={cell.warranty}
          onChange={(event) => onChange({warranty: event.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-sku`}>
          {t("sku")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${id}-sku`}
          value={cell.sku}
          maxLength={100}
          placeholder={t("skuPlaceholder")}
          onChange={(event) => onChange({sku: event.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-model`}>{t("model")}</Label>
        <Input id={`${id}-model`} value={cell.model ?? ""} maxLength={100} onChange={(event) => onChange({model: event.target.value})} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-barcode`}>{t("barcode")}</Label>
        <Input
          id={`${id}-barcode`}
          value={cell.barcode ?? ""}
          maxLength={100}
          onChange={(event) => onChange({barcode: event.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-release`}>{t("releaseAt")}</Label>
        <Input
          id={`${id}-release`}
          type="date"
          value={cell.releaseAt ?? ""}
          onChange={(event) => onChange({releaseAt: event.target.value})}
        />
      </div>
    </>
  );
}

export function MoneyInput({id, value, onChange, label}: {id?: string; value: string; onChange: (value: string) => void; label?: string}) {
  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 border-r pr-2 text-sm text-muted-foreground"
        aria-hidden="true"
      >
        ₫
      </span>
      <Input
        id={id}
        aria-label={label}
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        className="pl-10"
        placeholder="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function VariantTable({
  value,
  rows,
  onChange,
  setCell,
}: {
  value: VariantMatrixState;
  rows: ReturnType<typeof variantRows>;
  onChange: (next: VariantMatrixState) => void;
  setCell: (key: string, patch: Partial<VariantCell>) => void;
}) {
  const t = useTranslations("admin.variantMatrix");
  const [bulk, setBulk] = useState({price: "", quantity: "", warranty: ""});
  const groups = value.groups.filter((group) => group.values.some((item) => item.text.trim()));
  const [first, second] = groups;
  /** Rows under one option of the first group, so its cell (and picture) is drawn once for all of them. */
  const span = second ? second.values.filter((item) => item.text.trim()).length : 1;

  function applyAll() {
    const cells = {...value.cells};
    for (const row of rows) {
      cells[row.key] = {
        ...cellOf(value, row.key),
        ...(bulk.price.trim() ? {price: bulk.price} : {}),
        ...(bulk.quantity.trim() ? {quantity: bulk.quantity} : {}),
        ...(bulk.warranty.trim() ? {warranty: bulk.warranty} : {}),
      };
    }
    onChange({...value, cells});
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/20 p-3">
        <div className="w-40 space-y-1">
          <Label htmlFor="variant-bulk-price" className="text-xs">
            {t("price")}
          </Label>
          <MoneyInput id="variant-bulk-price" value={bulk.price} onChange={(price) => setBulk((current) => ({...current, price}))} />
        </div>
        <div className="w-32 space-y-1">
          <Label htmlFor="variant-bulk-stock" className="text-xs">
            {t("stock")}
          </Label>
          <Input
            id="variant-bulk-stock"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={bulk.quantity}
            onChange={(event) => setBulk((current) => ({...current, quantity: event.target.value}))}
          />
        </div>
        <div className="w-32 space-y-1">
          <Label htmlFor="variant-bulk-warranty" className="text-xs">
            {t("warranty")}
          </Label>
          <Input
            id="variant-bulk-warranty"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={bulk.warranty}
            onChange={(event) => setBulk((current) => ({...current, warranty: event.target.value}))}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={applyAll}
          disabled={!bulk.price.trim() && !bulk.quantity.trim() && !bulk.warranty.trim()}
        >
          {t("applyAll")}
        </Button>
        <p className="ml-auto text-xs text-muted-foreground">{t("rowCount", {count: rows.length})}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[96rem] border-collapse text-sm">
          <thead className="bg-muted/50 text-center">
            <tr>
              <Th>{first.name.trim() || t("groupLabel", {n: 1})}</Th>
              {second ? <Th>{second.name.trim() || t("groupLabel", {n: 2})}</Th> : null}
              <Th required>{t("price")}</Th>
              <Th required>{t("stock")}</Th>
              <Th required>{t("warranty")}</Th>
              <Th required>{t("sku")}</Th>
              <Th>{t("model")}</Th>
              <Th>{t("barcode")}</Th>
              <Th>{t("releaseAt")}</Th>
              <Th>{t("variantDescription")}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const cell = cellOf(value, row.key);
              const startsGroup = index % span === 0;
              return (
                <tr key={row.key} className={cn("border-t", startsGroup && "border-t-2")}>
                  {startsGroup ? (
                    <td rowSpan={span} className="w-40 border-r px-3 py-3 text-center align-middle">
                      <p className="mb-2 break-words font-medium">{row.values[0].text.trim()}</p>
                      <ValueImage
                        label={row.values[0].text.trim()}
                        image={value.images[row.values[0].id]}
                        onChange={(image) => {
                          const images = {...value.images};
                          if (image) images[row.values[0].id] = image;
                          else delete images[row.values[0].id];
                          onChange({...value, images});
                        }}
                      />
                    </td>
                  ) : null}
                  {second ? <td className="w-28 border-r px-3 py-3 text-center">{row.values[1].text.trim()}</td> : null}
                  <td className="border-r px-3 py-3">
                    <MoneyInput
                      label={t("priceOf", {name: row.options.map((option) => option.value).join(" / ")})}
                      value={cell.price}
                      onChange={(price) => setCell(row.key, {price})}
                    />
                  </td>
                  <td className="border-r px-3 py-3">
                    <Input
                      aria-label={t("stockOf", {name: row.options.map((option) => option.value).join(" / ")})}
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={cell.quantity}
                      onChange={(event) => setCell(row.key, {quantity: event.target.value})}
                    />
                  </td>
                  <td className="border-r px-3 py-3">
                    <Input
                      aria-label={t("warrantyOf", {name: row.options.map((option) => option.value).join(" / ")})}
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={cell.warranty}
                      onChange={(event) => setCell(row.key, {warranty: event.target.value})}
                    />
                  </td>
                  <td className="border-r px-3 py-3">
                    <Input
                      aria-label={t("skuOf", {name: row.options.map((option) => option.value).join(" / ")})}
                      value={cell.sku}
                      maxLength={100}
                      placeholder={t("skuPlaceholder")}
                      onChange={(event) => setCell(row.key, {sku: event.target.value})}
                    />
                  </td>
                  <td className="border-r px-3 py-3">
                    <Input
                      aria-label={t("modelOf", {name: row.options.map((option) => option.value).join(" / ")})}
                      value={cell.model ?? ""}
                      maxLength={100}
                      onChange={(event) => setCell(row.key, {model: event.target.value})}
                    />
                  </td>
                  <td className="border-r px-3 py-3">
                    <Input
                      aria-label={t("barcodeOf", {name: row.options.map((option) => option.value).join(" / ")})}
                      value={cell.barcode ?? ""}
                      maxLength={100}
                      onChange={(event) => setCell(row.key, {barcode: event.target.value})}
                    />
                  </td>
                  <td className="border-r px-3 py-3">
                    <Input
                      aria-label={t("releaseAtOf", {name: row.options.map((option) => option.value).join(" / ")})}
                      type="date"
                      value={cell.releaseAt ?? ""}
                      onChange={(event) => setCell(row.key, {releaseAt: event.target.value})}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      aria-label={t("variantDescriptionOf", {name: row.options.map((option) => option.value).join(" / ")})}
                      value={cell.description ?? ""}
                      onChange={(event) => setCell(row.key, {description: event.target.value})}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({children, required}: {children: string; required?: boolean}) {
  return (
    <th scope="col" className="border-r px-3 py-3 font-medium last:border-r-0">
      {required ? <span className="mr-1 text-destructive">*</span> : null}
      {children}
    </th>
  );
}

/** A square to put a picture on one option of the first group; the variants of that option share it. */
export function ValueImage({
  label,
  image,
  onChange,
}: {
  label: string;
  image?: {fileId: string; url?: string};
  onChange: (image: {fileId: string; url?: string} | null) => void;
}) {
  const t = useTranslations("admin.variantMatrix");
  const upload = useUploadAdminFile();
  const [failed, setFailed] = useState(false);
  async function pick(file?: File) {
    if (!file) return;
    setFailed(false);
    try {
      const uploaded = await upload.mutateAsync(file);
      if (uploaded.id) onChange({fileId: uploaded.id, url: uploaded.publicUrl});
    } catch {
      setFailed(true);
    }
  }
  return (
    <div className="relative mx-auto size-16">
      <label
        className={cn(
          "flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-background text-primary transition hover:border-primary/60 hover:bg-primary/5",
          failed && "border-destructive text-destructive",
        )}
        title={failed ? t("imageFailed") : t("imageFor", {name: label})}
      >
        {upload.isPending ? (
          <LoaderCircle className="size-5 animate-spin" />
        ) : image?.url ? (
          <Image src={image.url} alt="" fill sizes="64px" unoptimized className="object-cover" />
        ) : (
          <ImagePlus className="size-5" />
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          aria-label={t("imageFor", {name: label})}
          disabled={upload.isPending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void pick(file);
          }}
        />
      </label>
      {image ? (
        <button
          type="button"
          aria-label={t("removeImage")}
          className="absolute -right-2 -top-2 rounded-full border bg-background p-0.5 shadow-sm hover:bg-muted"
          onClick={() => onChange(null)}
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
}
