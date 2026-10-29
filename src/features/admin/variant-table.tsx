"use client";

import {Plus, Undo2} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState, type FormEvent, type ReactNode} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ConfirmAction} from "@/components/ui/confirm-action";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import type {ProductDetail, ProductVariant} from "@/features/catalog/contracts/responses";
import {ResourceStatus, type EditableResourceStatus} from "@/lib/domain/catalog-enums";

import {useCreateAdminVariant, useDeleteAdminVariant, useUpdateAdminVariant} from "./queries";
import {CellFields, MoneyInput, ValueImage, VariantMatrixEditor} from "./variant-matrix";
import {
  buildVariantRequests,
  emptyMatrix,
  isValidCell,
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

/** The update the backend takes for an edited row; the options are the columns of the table. */
function updateRequest(row: RowDraft, optionNames: string[]) {
  return {
    price: Number(row.price),
    quantity: Number(row.quantity),
    sku: row.sku.trim(),
    model: row.model.trim() || undefined,
    barcode: row.barcode.trim() || undefined,
    releaseAt: row.releaseAt || undefined,
    description: row.description.trim() || undefined,
    warrantyMonths: Number(row.warranty),
    imageFileId: row.image?.fileId,
    options: optionNames.map((name) => ({name, value: (row.options[name] ?? "").trim()})).filter((option) => option.value),
    status: row.status,
  };
}

/** The variants of a product as a table you edit in place, and the same editor as the create page to add more. */
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
        <AddVariants productId={product.id} withSingle={variants.length === 0} />
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
      await update.mutateAsync({productId, id: variant.id, request: updateRequest(row, [])});
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void submit(event)}>
      <div className="grid gap-4 sm:grid-cols-3">
        <CellFields id="variant-edit" cell={row} onChange={(change) => patch(change)} />
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
      await update.mutateAsync({productId, id: variant.id, request: updateRequest(row, names)});
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
                  <td key={name} className="min-w-32 px-3 py-3">
                    <Input
                      aria-label={`${name} · ${label}`}
                      value={row.options[name] ?? ""}
                      maxLength={255}
                      onChange={(event) => patch(variant, {options: {...row.options, [name]: event.target.value}})}
                    />
                  </td>
                ))}
                <td className="min-w-40 px-3 py-3">
                  <MoneyInput label={tv("priceOf", {name: label})} value={row.price} onChange={(price) => patch(variant, {price})} />
                </td>
                <td className="min-w-24 px-3 py-3">
                  <Input
                    aria-label={tv("stockOf", {name: label})}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={row.quantity}
                    onChange={(event) => patch(variant, {quantity: event.target.value})}
                  />
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
                    className="h-9 w-36"
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

/**
 * New variants, made the way the create page makes them. A variant that fails leaves the ones before it made;
 * pressing the button again makes only those still missing.
 */
function AddVariants({productId, withSingle}: {productId: string; withSingle: boolean}) {
  const tv = useTranslations("admin.variantMatrix");
  const create = useCreateAdminVariant();
  const [matrix, setMatrix] = useState(emptyMatrix);
  const [problem, setProblem] = useState<VariantProblem | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(null);
  const requests = buildVariantRequests(matrix);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateMatrix(matrix);
    setProblem(found);
    if (found) return;
    setError(null);
    const made = [...done];
    for (const {key, request} of requests) {
      if (made.includes(key)) continue;
      try {
        await create.mutateAsync({productId, request});
      } catch (cause) {
        setError(cause);
        setDone(made);
        return;
      }
      made.push(key);
    }
    setDone([]);
    setMatrix(emptyMatrix());
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void submit(event)}>
      <VariantMatrixEditor
        title={tv("addTitle")}
        description={tv("addDescription")}
        value={matrix}
        withSingle={withSingle}
        onChange={(next) => {
          setMatrix(next);
          setProblem(null);
        }}
        problem={problem}
      />
      {error ? (
        <div role="alert" className="space-y-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium">{tv("addPartial", {done: done.length, total: requests.length})}</p>
          <ErrorMessage error={error} />
        </div>
      ) : null}
      <Button type="submit" disabled={create.isPending || requests.length === 0}>
        <Plus className="size-4" />
        {tv("addVariants")}
      </Button>
    </form>
  );
}
