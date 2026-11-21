"use client";

import {Undo2} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState, type FormEvent, type ReactNode} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ConfirmAction} from "@/components/ui/confirm-action";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import type {ProductDetail, ProductOption, ProductVariant} from "@/features/catalog/contracts/responses";
import {ResourceStatus, type EditableResourceStatus} from "@/lib/domain/catalog-enums";

import {useAdjustAdminVariantStock, useDeleteAdminVariant, useSaveAdminVariations, useUpdateAdminVariant} from "./queries";
import {CellFields, MoneyInput, ValueImage, VariantMatrixEditor} from "./variant-matrix";
import {
  buildVariationItems,
  carryExisting,
  cellFromVariant,
  isValidCell,
  lockedValueIds,
  matrixFromVariants,
  validateMatrix,
  type VariantImage,
  type VariantProblem,
} from "./variant-matrix-model";

/** What a row of the table holds while it is being edited; everything is text, as in the inputs. */
type RowDraft = {
  price: string;
  quantity: string;
  warranty: string;
  sku: string;
  model: string;
  barcode: string;
  releaseAt: string;
  description: string;
  status: EditableResourceStatus;
  options: Record<string, string>;
  image?: VariantImage;
};

function draftOf(variant: ProductVariant): RowDraft {
  return {
    price: String(variant.price),
    quantity: String(variant.quantity),
    warranty: String(variant.warrantyMonths ?? 12),
    sku: variant.sku,
    model: variant.model ?? "",
    barcode: variant.barcode ?? "",
    releaseAt: variant.releaseAt ?? "",
    description: variant.description ?? "",
    status: (variant.status as EditableResourceStatus | undefined) ?? ResourceStatus.Active,
    options: Object.fromEntries(variant.options.map((option) => [option.name, option.value])),
    image: variant.imageFileId ? {fileId: variant.imageFileId, url: variant.imageUrl} : undefined,
  };
}

/** The update the backend takes for an edited row. Options change through the variations editor, so they are sent as they are. */
function updateRequest(row: RowDraft, options: ProductOption[]) {
  return {
    price: Number(row.price),
    sku: row.sku.trim(),
    model: row.model.trim() || undefined,
    barcode: row.barcode.trim() || undefined,
    releaseAt: row.releaseAt || undefined,
    description: row.description.trim() || undefined,
    warrantyMonths: Number(row.warranty),
    imageFileId: row.image?.fileId,
    options: options.map((option) => ({name: option.name, value: option.value})),
    status: row.status,
  };
}

/** The variants of a product as a table you edit in place, and the create page's editor to change the variations as a whole. */
export function ProductVariantsSection({product}: {product: ProductDetail}) {
  const t = useTranslations("admin");
  const tv = useTranslations("admin.variantMatrix");
  const variants = product.variants ?? [];
  const single = variants.length === 1 && variants[0].options.length === 0 ? variants[0] : null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{single ? tv("singleTitle") : tv("title")}</CardTitle>
        <CardDescription>{single ? tv("singleEditDescription") : t("variantDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {single ? (
          <SingleVariantForm key={single.id} productId={product.id} variant={single} />
        ) : variants.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t("noVariants")}</p>
        ) : (
          <VariantRows productId={product.id} variants={variants} />
        )}
        <VariationsEditor productId={product.id} active={variants.filter((variant) => variant.status === ResourceStatus.Active)} />
      </CardContent>
    </Card>
  );
}

/**
 * The only variant of a product without options is the price and stock of the product itself, so it is edited as a
 * form like on the create page. It cannot be deleted: the product would have nothing left to sell.
 */
function SingleVariantForm({productId, variant}: {productId: string; variant: ProductVariant}) {
  const t = useTranslations("admin");
  const tv = useTranslations("admin.variantMatrix");
  const update = useUpdateAdminVariant();
  const original = draftOf(variant);
  const [row, setRow] = useState(original);
  const [error, setError] = useState<unknown>(null);
  const dirty = JSON.stringify(row) !== JSON.stringify(original);
  const patch = (change: Partial<RowDraft>) => {
    setRow((all) => ({...all, ...change}));
    setError(null);
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isValidCell(row)) {
      setError(tv("problem.cells", {count: 1}));
      return;
    }
    try {
      await update.mutateAsync({productId, id: variant.id, request: updateRequest(row, variant.options)});
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void submit(event)}>
      <div className="grid gap-4 sm:grid-cols-3">
        <CellFields id="variant-edit" cell={row} stockLocked onChange={(change) => patch(change)} />
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="variant-edit-description">{tv("variantDescription")}</Label>
          <Input id="variant-edit-description" value={row.description} onChange={(event) => patch({description: event.target.value})} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="variant-edit-status">{t("status")}</Label>
          <Select
            id="variant-edit-status"
            value={row.status}
            onChange={(event) => patch({status: event.target.value as EditableResourceStatus})}
          >
            <option value={ResourceStatus.Active}>{t(`statusValues.${ResourceStatus.Active}`)}</option>
            <option value={ResourceStatus.Inactive}>{t(`statusValues.${ResourceStatus.Inactive}`)}</option>
          </Select>
        </div>
      </div>
      <StockAdjuster productId={productId} variant={variant} />
      {error ? (
        typeof error === "string" ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <ErrorMessage error={error} />
        )
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={!dirty || update.isPending}>
          {tv("saveRow")}
        </Button>
        {dirty ? (
          <Button type="button" variant="ghost" onClick={() => setRow(original)}>
            <Undo2 className="size-4" />
            {tv("undo")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function VariantRows({productId, variants}: {productId: string; variants: ProductVariant[]}) {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.productList");
  const tv = useTranslations("admin.variantMatrix");
  const update = useUpdateAdminVariant();
  const remove = useDeleteAdminVariant();
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [errors, setErrors] = useState<Record<string, unknown>>({});
  /** The option names in the order they first appear, one column each (Color, Size…). */
  const names = [...new Set(variants.flatMap((variant) => variant.options.map((option) => option.name)))];

  const original = (variant: ProductVariant) => draftOf(variant);
  const current = (variant: ProductVariant) => drafts[variant.id] ?? original(variant);
  const dirty = (variant: ProductVariant) => JSON.stringify(current(variant)) !== JSON.stringify(original(variant));
  const patch = (variant: ProductVariant, change: Partial<RowDraft>) => {
    setDrafts((all) => ({...all, [variant.id]: {...current(variant), ...change}}));
    setErrors((all) => ({...all, [variant.id]: undefined}));
  };
  const drop = (id: string) => {
    setDrafts((all) => Object.fromEntries(Object.entries(all).filter(([key]) => key !== id)));
    setErrors((all) => ({...all, [id]: undefined}));
  };

  async function save(variant: ProductVariant) {
    const row = current(variant);
    if (!isValidCell(row)) {
      setErrors((all) => ({...all, [variant.id]: tv("problem.cells", {count: 1})}));
      return;
    }
    try {
      await update.mutateAsync({productId, id: variant.id, request: updateRequest(row, variant.options)});
      drop(variant.id);
    } catch (error) {
      setErrors((all) => ({...all, [variant.id]: error}));
    }
  }

  const columns = 1 + names.length + 9;
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[110rem] border-collapse text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <Th>{tv("image")}</Th>
            {names.map((name) => (
              <Th key={name}>{name}</Th>
            ))}
            <Th>{tv("price")}</Th>
            <Th>{tv("stock")}</Th>
            <Th>{tv("warranty")}</Th>
            <Th>{tv("sku")}</Th>
            <Th>{tv("model")}</Th>
            <Th>{tv("barcode")}</Th>
            <Th>{tv("releaseAt")}</Th>
            <Th>{tv("variantDescription")}</Th>
            <Th>{t("status")}</Th>
            <Th>{tl("actions")}</Th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => {
            const row = current(variant);
            const edited = dirty(variant);
            const label = variant.options.map((option) => option.value).join(" / ") || variant.sku;
            return (
              <VariantRow key={variant.id} columns={columns} edited={edited} error={errors[variant.id]}>
                <td className="px-3 py-3">
                  <ValueImage label={label} image={row.image} onChange={(image) => patch(variant, {image: image ?? undefined})} />
                </td>
                {names.map((name) => (
                  <td key={name} className="min-w-32 px-3 py-3 align-middle font-medium">
                    {row.options[name] ?? "—"}
                  </td>
                ))}
                <td className="min-w-40 px-3 py-3">
                  <MoneyInput label={tv("priceOf", {name: label})} value={row.price} onChange={(price) => patch(variant, {price})} />
                </td>
                <td className="min-w-36 px-3 py-3">
                  <p className="mb-1 font-medium tabular-nums" aria-label={tv("stockOf", {name: label})}>
                    {variant.quantity}
                  </p>
                  <StockAdjuster productId={productId} variant={variant} label={label} />
                </td>
                <td className="min-w-28 px-3 py-3">
                  <Input
                    aria-label={tv("warrantyOf", {name: label})}
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={row.warranty}
                    onChange={(event) => patch(variant, {warranty: event.target.value})}
                  />
                </td>
                <td className="min-w-56 px-3 py-3">
                  <Input
                    aria-label={tv("skuOf", {name: label})}
                    value={row.sku}
                    maxLength={100}
                    onChange={(event) => patch(variant, {sku: event.target.value})}
                  />
                </td>
                <td className="min-w-36 px-3 py-3">
                  <Input
                    aria-label={tv("modelOf", {name: label})}
                    value={row.model}
                    maxLength={100}
                    onChange={(event) => patch(variant, {model: event.target.value})}
                  />
                </td>
                <td className="min-w-40 px-3 py-3">
                  <Input
                    aria-label={tv("barcodeOf", {name: label})}
                    value={row.barcode}
                    maxLength={100}
                    onChange={(event) => patch(variant, {barcode: event.target.value})}
                  />
                </td>
                <td className="min-w-40 px-3 py-3">
                  <Input
                    aria-label={tv("releaseAtOf", {name: label})}
                    type="date"
                    value={row.releaseAt}
                    onChange={(event) => patch(variant, {releaseAt: event.target.value})}
                  />
                </td>
                <td className="min-w-56 px-3 py-3">
                  <Input
                    aria-label={tv("variantDescriptionOf", {name: label})}
                    value={row.description}
                    onChange={(event) => patch(variant, {description: event.target.value})}
                  />
                </td>
                <td className="px-3 py-3">
                  <Select
                    className="h-9 w-44"
                    aria-label={`${t("status")} · ${label}`}
                    value={row.status}
                    onChange={(event) => patch(variant, {status: event.target.value as EditableResourceStatus})}
                  >
                    <option value={ResourceStatus.Active}>{t(`statusValues.${ResourceStatus.Active}`)}</option>
                    <option value={ResourceStatus.Inactive}>{t(`statusValues.${ResourceStatus.Inactive}`)}</option>
                  </Select>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col items-start gap-1.5">
                    {edited ? (
                      <>
                        <Button type="button" size="xs" disabled={update.isPending} onClick={() => void save(variant)}>
                          {tv("saveRow")}
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          size="xs"
                          className="h-auto p-0 text-sm font-medium"
                          onClick={() => drop(variant.id)}
                        >
                          <Undo2 className="size-3.5" />
                          {tv("undo")}
                        </Button>
                      </>
                    ) : null}
                    <ConfirmAction
                      title={t("confirmDelete")}
                      confirmLabel={t("delete")}
                      cancelLabel={t("cancel")}
                      onConfirm={() => remove.mutateAsync({productId, id: variant.id})}
                      variant="link"
                      size="xs"
                      className="h-auto p-0 text-sm font-medium text-destructive"
                    >
                      {t("delete")}
                    </ConfirmAction>
                  </div>
                </td>
              </VariantRow>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** A row, with the message under it when saving it failed; a row with unsaved changes is tinted. */
function VariantRow({columns, edited, error, children}: {columns: number; edited: boolean; error: unknown; children: ReactNode}) {
  return (
    <>
      <tr className={`border-t align-top ${edited ? "bg-primary/5" : ""}`}>{children}</tr>
      {error ? (
        <tr className="bg-destructive/5">
          <td colSpan={columns + 1} className="px-3 py-2">
            {typeof error === "string" ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : (
              <ErrorMessage error={error} />
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Th({children}: {children: ReactNode}) {
  return (
    <th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
      {children}
    </th>
  );
}

/** Adds or takes off stock by an amount, so what orders took since the page was loaded is never undone. */
function StockAdjuster({productId, variant, label}: {productId: string; variant: ProductVariant; label?: string}) {
  const t = useTranslations("admin");
  const tv = useTranslations("admin.variantMatrix");
  const adjust = useAdjustAdminVariantStock();
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState("");
  const [error, setError] = useState<unknown>(null);
  const amount = Number(delta.trim());
  const valid = /^[+-]?\d+$/.test(delta.trim()) && amount !== 0;
  const close = () => {
    setOpen(false);
    setDelta("");
    setError(null);
  };

  async function submit() {
    if (!valid) return;
    try {
      await adjust.mutateAsync({productId, id: variant.id, delta: amount});
      close();
    } catch (cause) {
      setError(cause);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="link" size="xs" className="h-auto p-0 text-sm font-medium" onClick={() => setOpen(true)}>
        {tv("adjustStock")}
      </Button>
    );
  }
  return (
    <div className="max-w-xs space-y-2">
      <Input
        aria-label={tv("adjustStockOf", {name: label ?? variant.sku})}
        className="h-8"
        inputMode="numeric"
        placeholder={tv("adjustStockPlaceholder")}
        value={delta}
        autoFocus
        onChange={(event) => {
          setDelta(event.target.value);
          setError(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
        }}
      />
      <p className="text-xs text-muted-foreground">
        {valid ? tv("adjustStockPreview", {from: variant.quantity, to: variant.quantity + amount}) : tv("adjustStockHint")}
      </p>
      {error ? <ErrorMessage error={error} /> : null}
      <div className="flex gap-2">
        <Button type="button" size="xs" disabled={!valid || adjust.isPending} onClick={() => void submit()}>
          {tv("saveRow")}
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={close}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}

/**
 * The variations of the product as a whole, in the create page's editor: groups and options can be added or removed and
 * everything is saved in one call. Existing variants keep their stock and orders; an option an ordered variant uses
 * cannot be renamed. Variants on sale that are no longer listed are hidden, or deleted when nothing refers to them.
 */
function VariationsEditor({productId, active}: {productId: string; active: ProductVariant[]}) {
  const t = useTranslations("admin");
  const tv = useTranslations("admin.variantMatrix");
  const save = useSaveAdminVariations();
  const [open, setOpen] = useState(active.length === 0);
  const [matrix, setMatrix] = useState(() => matrixFromVariants(active));
  // Taken when the editor opens: an option typed afterwards is new, even once an ordered variant is carried onto it
  const [locked, setLocked] = useState(() => lockedValueIds(matrix));
  const [problem, setProblem] = useState<VariantProblem | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const items = buildVariationItems(matrix);
  const keptIds = new Set(items.map((item) => item.id).filter(Boolean));
  const leftOut = active.filter((variant) => !keptIds.has(variant.id));
  const grouped = matrix.groups.some((group) => group.values.some((value) => value.text.trim()));
  const nameOf = (variant: ProductVariant) => variant.options.map((option) => option.value).join(" / ") || variant.sku;

  function start() {
    const loaded = matrixFromVariants(active);
    setMatrix(loaded);
    setLocked(lockedValueIds(loaded));
    setProblem(null);
    setError(null);
    setConfirming(false);
    setOpen(true);
  }

  async function persist() {
    setError(null);
    try {
      await save.mutateAsync({productId, request: {variants: items}});
      setConfirming(false);
      setOpen(false);
    } catch (cause) {
      setConfirming(false);
      setError(cause);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateMatrix(matrix) ?? (items.length === 0 ? {code: "empty" as const} : null);
    setProblem(found);
    if (found) return;
    if (leftOut.length > 0) setConfirming(true);
    else void persist();
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={start}>
        {tv("editVariations")}
      </Button>
    );
  }
  return (
    <form className="space-y-4 rounded-xl border p-4" onSubmit={submit}>
      <VariantMatrixEditor
        title={tv("editVariationsTitle")}
        description={tv("editVariationsDescription")}
        value={matrix}
        lockedValues={locked}
        onChange={(next) => {
          setMatrix((previous) => carryExisting(previous, next));
          setProblem(null);
          setConfirming(false);
        }}
        problem={problem}
      />
      {!grouped && active.length > 1 ? (
        <div className="max-w-md space-y-2">
          <Label htmlFor="variation-keep">{tv("keepVariant")}</Label>
          <Select
            id="variation-keep"
            value={matrix.single.variantId ?? ""}
            onChange={(event) => {
              const kept = active.find((variant) => variant.id === event.target.value);
              if (kept) setMatrix((current) => ({...current, single: cellFromVariant(kept)}));
            }}
          >
            {active.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {nameOf(variant)}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      {confirming ? (
        <div role="alert" className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="font-medium">{tv("leftOutTitle", {count: leftOut.length})}</p>
          <p>{leftOut.map(nameOf).join(", ")}</p>
          <p className="text-muted-foreground">{tv("leftOutDescription")}</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={save.isPending} onClick={() => void persist()}>
              {tv("confirmSaveVariations")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      ) : null}
      {error ? <ErrorMessage error={error} /> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending || confirming}>
          {tv("saveVariations")}
        </Button>
        {active.length > 0 ? (
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
