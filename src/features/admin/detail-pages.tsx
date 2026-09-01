"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ImagePlus,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { AdminPageSkeleton } from "@/components/ui/loading-skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelectList } from "@/components/ui/multi-select-list";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/navigation";
import type {
  CategoryTree,
  ProductDetail,
  ProductOption,
  ProductVariant,
} from "@/features/catalog/contracts/responses";
import type {PaymentSummary} from "@/features/orders/contracts/responses";
import type {
  DiscountDetail,
  EmployeeDetail,
  Role,
} from "@/features/admin/contracts/responses";
import type {
  UpdateEmployeeRequest,
  UpdateSupplierRequest,
} from "@/features/admin/contracts/requests";
import { formatMoney } from "@/lib/format";
import {AccountStatus, Gender, type EmployeeGender} from "@/lib/domain/account-enums";
import {
  DiscountScope,
  DiscountStatus,
  DiscountType,
  OrderStatus,
  PaymentStatus,
  ORDER_STATUS_TRANSITIONS,
  type EditableDiscountStatus,
} from "@/lib/domain/commerce-enums";
import {ResourceStatus, type EditableResourceStatus} from "@/lib/domain/catalog-enums";
import { CatalogCategoryIcon } from "@/features/catalog/components/catalog-category-icon";
import { AdminPagination } from "./admin-pagination";
import { ConfirmAction } from "./confirm-action";
import { FileUploadField, type UploadedFile } from "./file-upload";
import { VariantTargetPicker } from "./management-forms";
import { SpecificationsEditor } from "./specifications-editor";
import { StatusSelect } from "./status-select";

import { useBrands, useCategories } from "@/features/catalog/queries";
import {
  useAdminCustomer,
  useAdminCustomerOrders,
  useAdminCustomerStatus,
  useAdminDiscount,
  useAdminEmployee,
  useAdminEmployeeStatus,
  useAdminOrder,
  useAdminOrderStatus,
  useAdminPaymentStatus,
  useAdminProduct,
  useAdminProductStatus,
  useAdminSuppliers,
  useAdminSupplier,
  useAdminDiscountStatus,
  useAddAdminVariantImage,
  useCreateAdminVariant,
  useDeleteAdminDiscount,
  useDeleteAdminProduct,
  useDeleteAdminSupplier,
  useDeleteAdminVariant,
  useDeleteAdminVariantImage,
  useOptions,
  useInvoices,
  useOrderInvoice,
  useRoles,
  useUpdateAdminDiscount,
  useUpdateAdminEmployee,
  useUpdateAdminProduct,
  useUpdateAdminSupplier,
  useUpdateAdminVariant,
} from "./queries";

/** Small shared back link so every admin detail screen has a predictable exit. */
function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      {children}
    </Link>
  );
}

function Loading() {
  return <AdminPageSkeleton />;
}
function Failure({ error }: { error: unknown }) {
  return <ErrorMessage error={error} />;
}
function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  min,
  max,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        min={min}
        max={max}
        disabled={disabled}
      />
    </div>
  );
}
function DateTimeField({
  id,
  label,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <Field
      id={id}
      label={label}
      type="datetime-local"
      value={value}
      onChange={onChange}
      required={required}
    />
  );
}
function FormError({
  error,
  formError,
}: {
  error: unknown;
  formError?: string;
}) {
  return error || formError ? (
    <div className="space-y-2">
      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}
      {error ? <ErrorMessage error={error} /> : null}
    </div>
  ) : null;
}
function flatten(
  categories: CategoryTree[],
  depth = 0,
): { id: string; label: string }[] {
  return categories.flatMap((category) => [
    ...(category.id
      ? [
          {
            id: category.id,
            label: `${"— ".repeat(depth)}${category.name ?? ""}`,
          },
        ]
      : []),
    ...flatten(category.children ?? [], depth + 1),
  ]);
}
function toDateTimeInput(value?: string) {
  return value ? value.slice(0, 16) : "";
}
function toIso(value: string) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}
function orderStatusOptions(current?: string) {
  return ORDER_STATUS_TRANSITIONS[current as OrderStatus] ?? Object.values(OrderStatus);
}

export function AdminProductDetailPage({ productId }: { productId: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const product = useAdminProduct(productId);
  const remove = useDeleteAdminProduct();
  if (product.isPending) return <Loading />;
  if (product.isError || !product.data)
    return (
      <>
        <BackLink href="/admin/products">{t("back")}</BackLink>
        <Failure error={product.error} />
      </>
    );
  return (
    <div>
      <BackLink href="/admin/products">{t("back")}</BackLink>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("productDetail")}</p>
          <h1 className="mt-2 text-3xl font-semibold">{product.data.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {product.data.id}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={product.data.status} />
          {product.data.seoName ? (
            <Link
              href={`/products/${product.data.seoName}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
            >
              <ExternalLink className="size-3.5" />
              {t("previewStorefront")}
            </Link>
          ) : null}
          <ConfirmAction
            title={t("confirmDelete")}
            confirmLabel={t("delete")}
            cancelLabel={t("cancel")}
            onConfirm={() =>
              remove.mutateAsync(productId).then(() => {
                router.push("/admin/products");
              })
            }
            size="sm"
            variant="destructive"
          >
            <Trash2 className="size-3.5" />
            {t("delete")}
          </ConfirmAction>
        </div>
      </div>
      {remove.isError ? <FormError error={remove.error} /> : null}
      <div className="space-y-6">
        <ProductEditor product={product.data} />
        <VariantManager product={product.data} />
      </div>
    </div>
  );
}

function ProductEditor({ product }: { product: ProductDetail }) {
  const t = useTranslations("admin");
  const categories = useCategories();
  const brands = useBrands();
  const suppliers = useAdminSuppliers({ limit: 100 });
  const update = useUpdateAdminProduct();
  const status = useAdminProductStatus();
  const defaults = useMemo(
    () => ({
      name: product.name ?? "",
      seoName: product.seoName ?? "",
      categoryId: product.category?.id ?? "",
      brandId: product.brand?.id ?? "",
      description: product.description ?? "",
      specifications: product.specifications
        ? JSON.stringify(product.specifications, null, 2)
        : "{}",
      supplierIds:
        product.suppliers?.flatMap((supplier) =>
          supplier.id ? [supplier.id] : [],
        ) ?? [],
    }),
    [product],
  );
  const [draft, setDraft] = useState<typeof defaults | null>(null);
  const [formError, setFormError] = useState("");
  const form = draft ?? defaults;
  function set<K extends keyof typeof defaults>(
    key: K,
    value: (typeof defaults)[K],
  ) {
    setDraft((current) => ({ ...(current ?? defaults), [key]: value }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    let specifications: Record<string, unknown> = {};
    try {
      specifications = JSON.parse(form.specifications || "{}");
    } catch {
      setFormError(t("invalidJson"));
      return;
    }
    const saved = await update.mutateAsync({
      id: product.id!,
      request: {
        name: form.name.trim(),
        seoName: form.seoName.trim(),
        categoryId: form.categoryId,
        brandId: form.brandId || undefined,
        supplierIds: form.supplierIds,
        description: form.description.trim() || undefined,
        specifications,
      },
    });
    if (saved)
      setDraft({
        ...form,
        name: saved.name ?? form.name,
        seoName: saved.seoName ?? form.seoName,
      });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editProduct")}</CardTitle>
        <CardDescription>{t("editProductDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => void submit(event)}
        >
          <Field
            id="admin-product-name"
            label={t("name")}
            value={form.name}
            onChange={(value) => set("name", value)}
            required
          />
          <Field
            id="admin-product-seo"
            label={t("seoName")}
            value={form.seoName}
            onChange={(value) => set("seoName", value)}
            required
          />
          <div className="space-y-2">
            <Label htmlFor="admin-product-category">{t("category")}</Label>
            <Select
              id="admin-product-category"
              value={form.categoryId}
              onChange={(event) => set("categoryId", event.target.value)}
              required
            >
              <option value="">{t("chooseCategory")}</option>
              {flatten(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-product-brand">{t("brand")}</Label>
            <Select
              id="admin-product-brand"
              value={form.brandId}
              onChange={(event) => set("brandId", event.target.value)}
            >
              <option value="">{t("noBrand")}</option>
              {(brands.data ?? [])
                .filter((brand) => brand.status === ResourceStatus.Active)
                .map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
            </Select>
          </div>
          <MultiSelectList
            id="admin-product-suppliers"
            label={t("suppliers")}
            hint={t("supplierHint")}
            options={(suppliers.data?.items ?? [])
              .filter((supplier) => supplier.id && supplier.status === ResourceStatus.Active)
              .map((supplier) => ({
                value: supplier.id!,
                label: supplier.name ?? supplier.id!,
                description: supplier.email ?? supplier.phone,
              }))}
            value={form.supplierIds}
            onChange={(value) => set("supplierIds", value)}
            selectedLabel={t("selectedCount", {count: form.supplierIds.length})}
            emptyLabel={t("noSuppliers")}
            className="sm:col-span-2"
          />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="admin-product-description">
              {t("description")}
            </Label>
            <Textarea
              id="admin-product-description"
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </div>
          <SpecificationsEditor
            categoryId={form.categoryId}
            value={form.specifications}
            onChange={(value) => set("specifications", value)}
            idPrefix="admin-product"
          />
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <Button type="submit" disabled={update.isPending}>
              <Save className="size-4" />
              {t("save")}
            </Button>
            <StatusSelect
              currentStatus={product.status ?? ResourceStatus.Active}
              options={[ResourceStatus.Active, ResourceStatus.Inactive]}
              label={t("status")}
              onStatus={(nextStatus) =>
                status.mutateAsync({ id: product.id!, status: nextStatus })
              }
              className="w-36"
              disabled={status.isPending}
            />
          </div>
          <FormError
            error={update.error ?? status.error}
            formError={formError}
          />
        </form>
      </CardContent>
    </Card>
  );
}

function VariantManager({ product }: { product: ProductDetail }) {
  const t = useTranslations("admin");
  const create = useCreateAdminVariant();
  const remove = useDeleteAdminVariant();
  const options = useOptions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    sku: "",
    model: "",
    barcode: "",
    releaseAt: "",
    listPrice: "",
    quantity: "0",
    warranty: "12",
    description: "",
    optionIds: [] as string[],
    images: [] as UploadedFile[],
    mainImageId: "",
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const selectedOptions = (options.data ?? []).filter(
      (option) => option.id && form.optionIds.includes(option.id),
    );
    const selectedTypes = selectedOptions
      .map((option) => option.type?.trim().toLowerCase())
      .filter(Boolean);
    if (new Set(selectedTypes).size !== selectedTypes.length) {
      setFormError(t("duplicateOptionType"));
      return;
    }
    await create.mutateAsync({
      productId: product.id!,
      request: {
        sku: form.sku.trim(),
        model: form.model.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        releaseAt: form.releaseAt || undefined,
        listPrice: Number(form.listPrice),
        quantity: Number(form.quantity),
        warranty: form.warranty.trim() || undefined,
        description: form.description.trim() || undefined,
        optionIds: form.optionIds,
        images: form.images
          .filter((file) => file.id)
          .map((file) => ({
            fileId: file.id!,
            name: file.originalName,
            isMain: file.id === form.mainImageId,
          })),
      },
    });
    setForm({
      sku: "",
      model: "",
      barcode: "",
      releaseAt: "",
      listPrice: "",
      quantity: "0",
      warranty: "12",
      description: "",
      optionIds: [],
      images: [],
      mainImageId: "",
    });
  }

  const variants = product.variants ?? [];
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle>{t("variants")}</CardTitle>
          <CardDescription className="mt-1">
            {t("variantDescription")}
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={createOpen}
          onClick={() => setCreateOpen((value) => !value)}
        >
          {createOpen ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
          {createOpen ? t("hideCreate") : t("createVariant")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {variants.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("noVariants")}
          </p>
        ) : (
          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={variant.id ?? index}
                className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted/60">
                      {variant.imageUrl ? (
                        <Image
                          src={variant.imageUrl}
                          alt={variant.sku ?? ""}
                          fill
                          sizes="64px"
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-primary/45">
                          <CatalogCategoryIcon
                            categoryName={product.category?.name ?? product.name}
                            className="size-8"
                            strokeWidth={1.45}
                          />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{variant.sku ?? "—"}</p>
                      <p className="mt-1 text-sm font-medium">
                        {formatMoney(variant.listPrice, "vi")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("stockLabel")}: {variant.quantity ?? 0} ·{" "}
                        {t("warranty")}: {variant.warranty ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {variant.options
                          ?.map((option) => `${option.type}: ${option.name}`)
                          .join(" · ") || t("noOptions")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={variant.status} />
                    {variant.id ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEditingId((current) =>
                            current === variant.id ? null : variant.id!,
                          )
                        }
                      >
                        <Pencil className="size-3.5" />
                        {editingId === variant.id ? t("close") : t("edit")}
                      </Button>
                    ) : null}
                    {variant.id ? (
                      <ConfirmAction
                        title={t("confirmDelete")}
                        confirmLabel={t("delete")}
                        cancelLabel={t("cancel")}
                        onConfirm={() => remove.mutateAsync(variant.id!)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="size-3.5" />
                        {t("delete")}
                      </ConfirmAction>
                    ) : null}
                  </div>
                </div>
                {editingId === variant.id && variant.id ? (
                  <div className="mt-5 space-y-5 border-t pt-5">
                    <VariantEditForm
                      variant={variant}
                      options={options.data ?? []}
                    />
                    <VariantImageManager variant={variant} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {createOpen ? (
          <form
            className="grid gap-4 rounded-2xl border bg-muted/20 p-4 sm:grid-cols-2"
            onSubmit={(event) => void submit(event)}
          >
            <div className="sm:col-span-2">
              <p className="font-semibold">{t("createVariant")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("variantCreateHint")}
              </p>
            </div>
            <Field
              id="variant-sku"
              label="SKU"
              value={form.sku}
              onChange={(value) =>
                setForm((current) => ({ ...current, sku: value }))
              }
              required
            />
            <Field
              id="variant-model"
              label={t("model")}
              value={form.model}
              onChange={(value) =>
                setForm((current) => ({ ...current, model: value }))
              }
            />
            <Field
              id="variant-barcode"
              label={t("barcode")}
              value={form.barcode}
              onChange={(value) =>
                setForm((current) => ({ ...current, barcode: value }))
              }
            />
            <Field
              id="variant-release"
              label={t("releaseAt")}
              type="date"
              value={form.releaseAt}
              onChange={(value) =>
                setForm((current) => ({ ...current, releaseAt: value }))
              }
            />
            <Field
              id="variant-price"
              label={t("listPrice")}
              type="number"
              min="0"
              value={form.listPrice}
              onChange={(value) =>
                setForm((current) => ({ ...current, listPrice: value }))
              }
              required
            />
            <Field
              id="variant-quantity"
              label={t("quantity")}
              type="number"
              min="0"
              value={form.quantity}
              onChange={(value) =>
                setForm((current) => ({ ...current, quantity: value }))
              }
              required
            />
            <Field
              id="variant-warranty"
              label={t("warranty")}
              value={form.warranty}
              onChange={(value) =>
                setForm((current) => ({ ...current, warranty: value }))
              }
            />
            <MultiSelectList
              id="variant-options"
              label={t("options")}
              hint={t("optionTypeHint")}
              options={(options.data ?? [])
                .filter((option) => option.id && option.status === ResourceStatus.Active)
                .map((option) => ({
                  value: option.id!,
                  label: option.name ?? option.id!,
                  description: `${option.type ?? "—"} · ${option.value ?? "—"}`,
                }))}
              value={form.optionIds}
              onChange={(value) =>
                setForm((current) => ({...current, optionIds: value}))
              }
              selectedLabel={t("selectedCount", {count: form.optionIds.length})}
              emptyLabel={t("noOptions")}
              className="sm:col-span-2"
            />
            <FileUploadField
              id="variant-files"
              label={t("variantImages")}
              multiple
              value={form.images}
              selectedMainId={form.mainImageId}
              onUploaded={(file) =>
                setForm((current) => ({
                  ...current,
                  images: [...current.images, file],
                  mainImageId: current.mainImageId || file.id || "",
                }))
              }
              onSelectMain={(fileId) =>
                setForm((current) => ({ ...current, mainImageId: fileId }))
              }
              onRemove={(fileId) =>
                setForm((current) => {
                  const images = current.images.filter(
                    (file) => file.id !== fileId,
                  );
                  return {
                    ...current,
                    images,
                    mainImageId:
                      current.mainImageId === fileId
                        ? (images[0]?.id ?? "")
                        : current.mainImageId,
                  };
                })
              }
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="variant-description">{t("description")}</Label>
              <Textarea
                id="variant-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <Button
                type="submit"
                disabled={create.isPending || !form.sku || !form.listPrice}
              >
                <Plus className="size-4" />
                {t("create")}
              </Button>
              {formError ? (
                <p className="text-sm text-destructive">{formError}</p>
              ) : null}
              {create.isError ? <FormError error={create.error} /> : null}
            </div>
          </form>
        ) : null}
        {remove.isError ? <FormError error={remove.error} /> : null}
      </CardContent>
    </Card>
  );
}

function VariantEditForm({
  variant,
  options,
}: {
  variant: ProductVariant;
  options: ProductOption[];
}) {
  const t = useTranslations("admin");
  const update = useUpdateAdminVariant();
  const defaults = useMemo(
    () => ({
      model: variant.model ?? "",
      barcode: variant.barcode ?? "",
      releaseAt: variant.releaseAt ?? "",
      listPrice: String(variant.listPrice ?? 0),
      quantity: String(variant.quantity ?? 0),
      warranty: variant.warranty ?? "",
      description: variant.description ?? "",
      optionIds:
        variant.options?.flatMap((option) => (option.id ? [option.id] : [])) ??
        [],
      status: (variant.status as EditableResourceStatus | undefined) ?? ResourceStatus.Active,
    }),
    [variant],
  );
  const [form, setForm] = useState<typeof defaults | null>(null);
  const [formError, setFormError] = useState("");
  const value = form ?? defaults;
  function set<K extends keyof typeof defaults>(
    key: K,
    next: (typeof defaults)[K],
  ) {
    setForm((current) => ({ ...(current ?? defaults), [key]: next }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const selectedOptions = options.filter(
      (option) => option.id && value.optionIds.includes(option.id),
    );
    const selectedTypes = selectedOptions
      .map((option) => option.type?.trim().toLowerCase())
      .filter(Boolean);
    if (new Set(selectedTypes).size !== selectedTypes.length) {
      setFormError(t("duplicateOptionType"));
      return;
    }
    await update.mutateAsync({
      id: variant.id!,
      request: {
        model: value.model.trim() || undefined,
        barcode: value.barcode.trim() || undefined,
        releaseAt: value.releaseAt || undefined,
        listPrice: Number(value.listPrice),
        quantity: Number(value.quantity),
        warranty: value.warranty.trim() || undefined,
        description: value.description.trim() || undefined,
        optionIds: value.optionIds,
        status: value.status,
      },
    });
  }
  return (
    <form
      className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2"
      onSubmit={(event) => void submit(event)}
    >
      <div className="sm:col-span-2">
        <p className="font-medium">{t("editVariant")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`variant-sku-${variant.id}`}>SKU</Label>
        <Input
          id={`variant-sku-${variant.id}`}
          value={variant.sku ?? "—"}
          readOnly
        />
      </div>
      <Field
        id={`variant-model-${variant.id}`}
        label={t("model")}
        value={value.model}
        onChange={(next) => set("model", next)}
      />
      <Field
        id={`variant-barcode-${variant.id}`}
        label={t("barcode")}
        value={value.barcode}
        onChange={(next) => set("barcode", next)}
      />
      <Field
        id={`variant-release-${variant.id}`}
        label={t("releaseAt")}
        type="date"
        value={value.releaseAt}
        onChange={(next) => set("releaseAt", next)}
      />
      <Field
        id={`variant-price-${variant.id}`}
        label={t("listPrice")}
        type="number"
        min="0"
        value={value.listPrice}
        onChange={(next) => set("listPrice", next)}
        required
      />
      <Field
        id={`variant-quantity-${variant.id}`}
        label={t("quantity")}
        type="number"
        min="0"
        value={value.quantity}
        onChange={(next) => set("quantity", next)}
        required
      />
      <Field
        id={`variant-warranty-${variant.id}`}
        label={t("warranty")}
        value={value.warranty}
        onChange={(next) => set("warranty", next)}
      />
      <div className="space-y-2">
        <Label htmlFor={`variant-status-${variant.id}`}>{t("status")}</Label>
        <Select
          id={`variant-status-${variant.id}`}
          value={value.status}
          onChange={(event) => set("status", event.target.value as EditableResourceStatus)}
        >
          <option value={ResourceStatus.Active}>{t("statusValues.ACTIVE")}</option>
          <option value={ResourceStatus.Inactive}>{t("statusValues.INACTIVE")}</option>
        </Select>
      </div>
      <MultiSelectList
        id={`variant-options-${variant.id}`}
        label={t("options")}
        hint={t("optionTypeHint")}
        options={options
          .filter((option) => option.id && option.status === ResourceStatus.Active)
          .map((option) => ({
            value: option.id!,
            label: option.name ?? option.id!,
            description: `${option.type ?? "—"} · ${option.value ?? "—"}`,
          }))}
        value={value.optionIds}
        onChange={(next) => set("optionIds", next)}
        selectedLabel={t("selectedCount", {count: value.optionIds.length})}
        emptyLabel={t("noOptions")}
        className="sm:col-span-2"
      />
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`variant-description-${variant.id}`}>
          {t("description")}
        </Label>
        <Textarea
          id={`variant-description-${variant.id}`}
          value={value.description}
          onChange={(event) => set("description", event.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={update.isPending}>
          <Save className="size-4" />
          {t("save")}
        </Button>
      </div>
      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      <FormError error={update.error} />{" "}
    </form>
  );
}

function VariantImageManager({
  variant,
}: {
  variant: ProductVariant;
}) {
  const t = useTranslations("admin");
  const add = useAddAdminVariantImage();
  const remove = useDeleteAdminVariantImage();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [form, setForm] = useState({ name: "", isMain: false });
  const images = (variant.images ?? []).filter(
    (image) => image.status !== ResourceStatus.Deleted,
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!uploadedFile?.id) return;
    await add.mutateAsync({
      variantId: variant.id!,
      request: {
        fileId: uploadedFile.id,
        name: form.name.trim() || undefined,
        isMain: form.isMain,
      },
    });
    setUploadedFile(null);
    setForm({ name: "", isMain: false });
  }
  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div>
        <p className="font-medium">{t("gallery")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("galleryDescription")}
        </p>
      </div>
      {images.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.id ?? index}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {image.imageUrl ? (
                  <Image
                    src={image.imageUrl}
                    alt={image.name ?? ""}
                    fill
                    sizes="48px"
                    unoptimized
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {image.name ?? t("image")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {image.main ? t("mainImage") : t("galleryImage")}
                </p>
              </div>
              {image.id ? (
                <ConfirmAction
                  title={t("confirmDelete")}
                  confirmLabel={t("delete")}
                  cancelLabel={t("cancel")}
                  onConfirm={() => remove.mutateAsync(image.id!)}
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  ariaLabel={t("delete")}
                >
                  <Trash2 className="size-4" />
                </ConfirmAction>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
          {t("noImages")}
        </p>
      )}
      <form
        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-end"
        onSubmit={(event) => void submit(event)}
      >
        <FileUploadField
          id={`new-image-file-${variant.id}`}
          label={t("image")}
          value={uploadedFile ? [uploadedFile] : []}
          onUploaded={setUploadedFile}
          onRemove={() => setUploadedFile(null)}
        />
        <Field
          id={`new-image-name-${variant.id}`}
          label={t("imageName")}
          value={form.name}
          onChange={(value) =>
            setForm((current) => ({ ...current, name: value }))
          }
        />
        <label className="flex h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isMain}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                isMain: event.target.checked,
              }))
            }
          />
          {t("mainImage")}
        </label>
        <Button
          type="submit"
          size="sm"
          disabled={add.isPending || !uploadedFile?.id}
        >
          <ImagePlus className="size-4" />
          {t("addImage")}
        </Button>
        <FormError error={add.error ?? remove.error} />
      </form>
    </div>
  );
}

export function AdminCustomerDetailPage({
  customerId,
}: {
  customerId: string;
}) {
  const t = useTranslations("admin");
  const customer = useAdminCustomer(customerId);
  const orders = useAdminCustomerOrders(customerId);
  const status = useAdminCustomerStatus();
  if (customer.isPending) return <Loading />;
  if (customer.isError || !customer.data)
    return (
      <>
        <BackLink href="/admin/customers">{t("back")}</BackLink>
        <Failure error={customer.error} />
      </>
    );
  const item = customer.data;
  return (
    <div>
      <BackLink href="/admin/customers">{t("back")}</BackLink>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("customerDetail")}</p>
          <h1 className="mt-2 text-3xl font-semibold">
            {item.fullName ?? item.email}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {item.accountId ?? item.id}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={item.status} />
          <StatusSelect
            currentStatus={item.status ?? AccountStatus.Active}
            options={[AccountStatus.Active, AccountStatus.Locked, AccountStatus.Inactive]}
            label={t("status")}
            onStatus={(nextStatus) =>
              status.mutateAsync({ id: customerId, status: nextStatus })
            }
            className="w-32"
            disabled={status.isPending}
          />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("customerInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>{t("email")}:</strong> {item.email ?? "—"}
            </p>
            <p>
              <strong>{t("phone")}:</strong> {item.phone ?? "—"}
            </p>
            <p>
              <strong>{t("gender")}:</strong> {item.gender ?? "—"}
            </p>
            <p>
              <strong>{t("birthday")}:</strong> {item.birthday ?? "—"}
            </p>
            <p>
              <strong>{t("totalOrders")}:</strong> {item.totalOrders ?? 0}
            </p>
            <p>
              <strong>{t("totalSpent")}:</strong>{" "}
              {formatMoney(item.totalSpent, "vi")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("addresses")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {item.addresses?.length ? (
              item.addresses.map((address, index) => (
                <div
                  key={address.id ?? index}
                  className="rounded-lg border p-3 text-sm"
                >
                  <p className="font-medium">
                    {address.recipientName}{" "}
                    {address.default ? `· ${t("defaultAddress")}` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {address.phone} · {address.addressLine}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("noAddresses")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("customerOrders")}</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.isPending ? (
            <Loading />
          ) : orders.isError ? (
            <Failure error={orders.error} />
          ) : orders.data?.length ? (
            <div className="space-y-3">
              {orders.data.map((order, index) => (
                <Link
                  key={order.orderId ?? index}
                  href={
                    order.orderId
                      ? `/admin/orders/${order.orderId}`
                      : "/admin/orders"
                  }
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm hover:bg-muted"
                >
                  <span>{order.orderId}</span>
                  <span className="text-muted-foreground">
                    {order.status} · {formatMoney(order.totalAmount, "vi")}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noOrders")}</p>
          )}
        </CardContent>
      </Card>
      <FormError error={status.error} />
    </div>
  );
}

export function AdminEmployeeDetailPage({
  employeeId,
}: {
  employeeId: string;
}) {
  const t = useTranslations("admin");
  const employee = useAdminEmployee(employeeId);
  const roles = useRoles();
  const update = useUpdateAdminEmployee();
  const status = useAdminEmployeeStatus();
  if (employee.isPending) return <Loading />;
  if (employee.isError || !employee.data)
    return (
      <>
        <BackLink href="/admin/employees">{t("back")}</BackLink>
        <Failure error={employee.error} />
      </>
    );
  return (
    <div>
      <BackLink href="/admin/employees">{t("back")}</BackLink>
      <h1 className="mb-8 text-3xl font-semibold">{t("employeeDetail")}</h1>
      <EmployeeForm
        employee={employee.data}
        roles={roles.data ?? []}
        onSubmit={(request) => update.mutateAsync({ id: employeeId, request })}
        loading={update.isPending}
        error={update.error}
        status={employee.data.status}
        onStatus={(next) =>
          status.mutateAsync({ id: employeeId, status: next })
        }
      />
    </div>
  );
}

type EmployeeRequest = UpdateEmployeeRequest;
function EmployeeForm({
  employee,
  roles,
  onSubmit,
  loading,
  error,
  status: currentStatus,
  onStatus,
}: {
  employee: EmployeeDetail;
  roles: Role[];
  onSubmit: (request: EmployeeRequest) => Promise<unknown>;
  loading: boolean;
  error: unknown;
  status?: string;
  onStatus: (status: string) => Promise<unknown>;
}) {
  const t = useTranslations("admin");
  const defaults = useMemo(
    () => ({
      fullName: employee.fullName ?? "",
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      gender: (employee.gender as EmployeeGender | undefined) ?? Gender.Male,
      roleId: employee.roleId ?? "",
      salary: String(employee.salary ?? 0),
      joinedAt: employee.joinedAt ?? "",
      birthday: employee.birthday ?? "",
      address: employee.address ?? "",
      avatarFile: employee.avatarFileId
        ? ({ id: employee.avatarFileId } as UploadedFile)
        : null,
    }),
    [employee],
  );
  const [form, setForm] = useState<typeof defaults | null>(null);
  const value = form ?? defaults;
  function set<K extends keyof typeof defaults>(
    key: K,
    next: (typeof defaults)[K],
  ) {
    setForm((current) => ({ ...(current ?? defaults), [key]: next }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      fullName: value.fullName.trim(),
      roleId: value.roleId,
      email: value.email.trim() || undefined,
      phone: value.phone.trim() || undefined,
      gender: value.gender || undefined,
      salary: Number(value.salary),
      joinedAt: value.joinedAt || undefined,
      birthday: value.birthday || undefined,
      address: value.address.trim() || undefined,
      avatarFileId: value.avatarFile?.id,
    });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editEmployee")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => void submit(event)}
        >
          <Field
            id="employee-name"
            label={t("fullName")}
            value={value.fullName}
            onChange={(next) => set("fullName", next)}
            required
          />
          <Field
            id="employee-email"
            label={t("email")}
            type="email"
            value={value.email}
            onChange={(next) => set("email", next)}
          />
          <Field
            id="employee-phone"
            label={t("phone")}
            value={value.phone}
            onChange={(next) => set("phone", next)}
          />
          <div className="space-y-2">
            <Label htmlFor="employee-role">{t("role")}</Label>
            <Select
              id="employee-role"
              value={value.roleId}
              onChange={(event) => set("roleId", event.target.value)}
              required
            >
              <option value="">{t("chooseRole")}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-gender">{t("gender")}</Label>
            <Select
              id="employee-gender"
              value={value.gender}
              onChange={(event) => set("gender", event.target.value as EmployeeGender)}
            >
              <option value={Gender.Male}>{t("male")}</option>
              <option value={Gender.Female}>{t("female")}</option>
            </Select>
          </div>
          <Field
            id="employee-salary"
            label={t("salary")}
            type="number"
            value={value.salary}
            onChange={(next) => set("salary", next)}
          />
          <Field
            id="employee-joined"
            label={t("joinedAt")}
            type="date"
            value={value.joinedAt}
            onChange={(next) => set("joinedAt", next)}
          />
          <Field
            id="employee-birthday"
            label={t("birthday")}
            type="date"
            value={value.birthday}
            onChange={(next) => set("birthday", next)}
          />
          <FileUploadField
            id="employee-avatar"
            label={t("avatar")}
            currentFileId={
              employee.avatarFileId && !value.avatarFile?.originalName
                ? String(employee.avatarFileId)
                : undefined
            }
            value={value.avatarFile?.originalName ? [value.avatarFile] : []}
            onUploaded={(file) => set("avatarFile", file)}
            onRemove={() => set("avatarFile", null)}
          />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="employee-address">{t("address")}</Label>
            <Textarea
              id="employee-address"
              value={value.address}
              onChange={(event) => set("address", event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              <Save className="size-4" />
              {t("save")}
            </Button>
            <StatusSelect
              currentStatus={currentStatus ?? AccountStatus.Active}
              options={[AccountStatus.Active, AccountStatus.Locked, AccountStatus.Inactive]}
              label={t("status")}
              onStatus={onStatus}
              className="w-32"
            />
          </div>
          <FormError error={error} />
        </form>
      </CardContent>
    </Card>
  );
}

export function AdminDiscountDetailPage({
  discountId,
}: {
  discountId: string;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const discount = useAdminDiscount(discountId);
  if (discount.isPending) return <Loading />;
  if (discount.isError || !discount.data)
    return (
      <>
        <BackLink href="/admin/discounts">{t("back")}</BackLink>
        <Failure error={discount.error} />
      </>
    );
  return (
    <div>
      <BackLink href="/admin/discounts">{t("back")}</BackLink>
      <h1 className="mb-8 text-3xl font-semibold">{t("discountDetail")}</h1>
      <DiscountForm
        discount={discount.data}
        onDeleted={() => router.push("/admin/discounts")}
      />
    </div>
  );
}

function DiscountForm({
  discount,
  create = false,
  onDeleted,
}: {
  discount?: DiscountDetail;
  create?: boolean;
  onDeleted?: () => void;
}) {
  const t = useTranslations("admin");
  const categories = useCategories();
  const update = useUpdateAdminDiscount();
  const remove = useDeleteAdminDiscount();
  const status = useAdminDiscountStatus();
  const defaults = useMemo(
    () => ({
      title: discount?.title ?? "",
      code: discount?.code ?? "",
      discountType: (discount?.discountType as DiscountType | undefined) ?? DiscountType.Percent,
      value: String(discount?.value ?? 10),
      applicationScope: (discount?.applicationScope as DiscountScope | undefined) ?? DiscountScope.Order,
      minOrderAmount: String(discount?.minOrderAmount ?? 0),
      startAt: toDateTimeInput(discount?.startAt),
      endAt: toDateTimeInput(discount?.endAt),
      description: discount?.description ?? "",
      categoryIds: discount?.appliedCategoryIds ?? [],
      variantIds:
        discount?.appliedVariants?.flatMap((variant) =>
          variant.id ? [variant.id] : [],
        ) ?? [],
    }),
    [discount],
  );
  const [form, setForm] = useState<typeof defaults | null>(null);
  const [formError, setFormError] = useState("");
  const value = form ?? defaults;
  function set<K extends keyof typeof defaults>(
    key: K,
    next: (typeof defaults)[K],
  ) {
    setForm((current) => ({ ...(current ?? defaults), [key]: next }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    if (
      (value.applicationScope === DiscountScope.Category &&
        value.categoryIds.length === 0) ||
      (value.applicationScope === DiscountScope.Variant && value.variantIds.length === 0)
    ) {
      setFormError(t("discountTargetRequired"));
      return;
    }
    const request = {
      title: value.title.trim(),
      code:
        value.applicationScope === DiscountScope.Order
          ? value.code.trim() || undefined
          : undefined,
      discountType: value.discountType,
      value: Number(value.value),
      startAt: toIso(value.startAt),
      endAt: toIso(value.endAt),
      applicationScope: value.applicationScope,
      minOrderAmount: Number(value.minOrderAmount),
      description: value.description.trim() || undefined,
      appliedCategoryIds:
        value.applicationScope === DiscountScope.Category ? value.categoryIds : [],
      appliedVariantIds:
        value.applicationScope === DiscountScope.Variant ? value.variantIds : [],
      ...(discount && !create
        ? {status: discount.status as EditableDiscountStatus | undefined}
        : {}),
    };
    if (discount?.id) await update.mutateAsync({ id: discount.id, request });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {create ? t("createDiscount") : t("editDiscount")}
        </CardTitle>
        <CardDescription>{t("discountTargetDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => void submit(event)}
        >
          <Field
            id="discount-title"
            label={t("titleField")}
            value={value.title}
            onChange={(next) => set("title", next)}
            required
          />
          <Field
            id="discount-code"
            label={t("code")}
            value={value.code}
            onChange={(next) => set("code", next)}
            disabled={value.applicationScope !== DiscountScope.Order}
          />
          <div className="space-y-2">
            <Label htmlFor="discount-type">{t("discountType")}</Label>
            <Select
              id="discount-type"
              value={value.discountType}
              onChange={(event) => set("discountType", event.target.value as DiscountType)}
            >
              <option value={DiscountType.Percent}>{t("discountTypeValues.PERCENT")}</option>
              <option value={DiscountType.Fixed}>{t("discountTypeValues.FIXED")}</option>
            </Select>
          </div>
          <Field
            id="discount-value"
            label={t("value")}
            type="number"
            value={value.value}
            onChange={(next) => set("value", next)}
            required
          />
          <DateTimeField
            id="discount-start"
            label={t("startAt")}
            value={value.startAt}
            onChange={(next) => set("startAt", next)}
            required
          />
          <DateTimeField
            id="discount-end"
            label={t("endAt")}
            value={value.endAt}
            onChange={(next) => set("endAt", next)}
            required
          />
          <Field
            id="discount-min"
            label={t("minOrderAmount")}
            type="number"
            value={value.minOrderAmount}
            onChange={(next) => set("minOrderAmount", next)}
          />
          <div className="space-y-2">
            <Label htmlFor="discount-scope">{t("applicationScope")}</Label>
            <Select
              id="discount-scope"
              value={value.applicationScope}
              onChange={(event) =>
                setForm((current) => ({
                  ...(current ?? defaults),
                  applicationScope: event.target.value as DiscountScope,
                  code:
                    event.target.value === DiscountScope.Order ? current?.code ?? "" : "",
                }))
              }
            >
              <option value={DiscountScope.Order}>{t("scopeValues.ORDER")}</option>
              <option value={DiscountScope.AllItems}>{t("scopeValues.ALL_ITEMS")}</option>
              <option value={DiscountScope.Category}>{t("scopeValues.CATEGORY")}</option>
              <option value={DiscountScope.Variant}>{t("scopeValues.VARIANT")}</option>
            </Select>
          </div>
          {value.applicationScope === DiscountScope.Category ? (
            <MultiSelectList
              id="discount-categories"
              label={t("targetCategories")}
              hint={t("targetCategoriesHint")}
              options={flatten(categories.data ?? []).map((category) => ({
                value: category.id,
                label: category.label,
              }))}
              value={value.categoryIds}
              onChange={(next) => set("categoryIds", next)}
              selectedLabel={t("selectedCount", {count: value.categoryIds.length})}
              emptyLabel={t("noCategories")}
              className="sm:col-span-2"
            />
          ) : null}
          {value.applicationScope === DiscountScope.Variant ? (
            <VariantTargetPicker
              value={value.variantIds}
              onChange={(next) => set("variantIds", next)}
            />
          ) : null}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="discount-description">{t("description")}</Label>
            <Textarea
              id="discount-description"
              value={value.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" disabled={update.isPending || !discount}>
              <Save className="size-4" />
              {t("save")}
            </Button>
            {discount?.id ? (
              <>
                <StatusSelect
                  currentStatus={discount.status ?? DiscountStatus.Active}
                  options={[DiscountStatus.Active, DiscountStatus.Inactive, DiscountStatus.Disabled, DiscountStatus.Expired]}
                  label={t("status")}
                  onStatus={(nextStatus) =>
                    status.mutateAsync({
                      id: discount.id!,
                      status: nextStatus,
                    })
                  }
                  className="w-36"
                  disabled={status.isPending}
                />
                <ConfirmAction
                  title={t("confirmDelete")}
                  confirmLabel={t("delete")}
                  cancelLabel={t("cancel")}
                  onConfirm={() =>
                    remove.mutateAsync(discount.id!).then(() => {
                      onDeleted?.();
                    })
                  }
                  size="default"
                  variant="destructive"
                >
                  <Trash2 className="size-4" />
                  {t("delete")}
                </ConfirmAction>
              </>
            ) : null}
          </div>
          <FormError
            error={update.error ?? status.error ?? remove.error}
            formError={formError}
          />
        </form>
      </CardContent>
    </Card>
  );
}

export function AdminOrderDetailPage({ orderId }: { orderId: string }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const order = useAdminOrder(orderId);
  const update = useAdminOrderStatus();
  const paymentStatus = useAdminPaymentStatus();
  const invoice = useOrderInvoice(orderId, order.data?.status === OrderStatus.Completed);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  if (order.isPending) return <Loading />;
  if (order.isError || !order.data)
    return (
      <>
        <BackLink href="/admin/orders">{t("back")}</BackLink>
        <Failure error={order.error} />
      </>
    );
  const item = order.data;
  const changeStatus = (nextStatus: string) => {
    if (!nextStatus || nextStatus === item.status) return;
    if (nextStatus === OrderStatus.Cancelled) {
      setCancelReason("");
      setShowCancelDialog(true);
      return;
    }
    void update.mutateAsync({
      id: orderId,
      status: nextStatus,
    });
  };
  async function confirmCancel() {
    await update.mutateAsync({
      id: orderId,
      status: OrderStatus.Cancelled,
      reason: cancelReason.trim() || undefined,
    });
    setShowCancelDialog(false);
  }
  return (
    <div>
      <BackLink href="/admin/orders">{t("back")}</BackLink>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("orderDetail")}</p>
          <h1 className="mt-2 text-3xl font-semibold">{item.id}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {item.customerName ?? item.customerEmail ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={item.status} />
          <Select
            className="w-52"
            value={item.status ?? ""}
            onChange={(event) => changeStatus(event.target.value)}
            disabled={update.isPending}
          >
            {orderStatusOptions(item.status).map((status) => (
              <option key={status} value={status}>
                {t.has(`statusValues.${status}`)
                  ? t(`statusValues.${status}`)
                  : status}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("items")}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {item.items?.length ? (
                item.items.map((line, index) => (
                  <div
                    key={line.id ?? index}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {line.productName ?? line.sku ?? "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {line.quantity} × {formatMoney(line.unitPrice, locale)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          {t("itemGross")}: {formatMoney(line.itemGross, locale)}
                        </span>
                        <span>
                          {t("itemDiscount")}: −{" "}
                          {formatMoney(line.itemDiscount, locale)}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-right font-semibold">
                      <span className="block text-xs font-normal text-muted-foreground">
                        {t("itemNet")}
                      </span>
                      {formatMoney(line.totalAmount, locale)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("noItems")}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("paymentAttempts")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.payments?.length ? (
                item.payments.map((payment, index) => (
                    <AdminOrderPaymentRow
                      key={payment.id ?? index}
                      payment={payment}
                      locale={locale}
                      mutation={paymentStatus}
                    />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("noPayments")}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("invoice")}</CardTitle>
            </CardHeader>
            <CardContent>
              {item.status !== OrderStatus.Completed ? (
                <p className="text-sm text-muted-foreground">
                  {t("invoiceUnavailable")}
                </p>
              ) : invoice.isPending ? (
                <Skeleton className="h-12 rounded-lg" />
              ) : invoice.isError ? (
                <Failure error={invoice.error} />
              ) : invoice.data ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>{t("invoiceCode")}:</strong>{" "}
                    {invoice.data.invoiceId ?? "—"}
                  </p>
                  <p>
                    <strong>{t("paymentStatus")}:</strong>{" "}
                    {invoice.data.paymentStatus ?? "—"}
                  </p>
                  <p>
                    {invoice.data.recipientName} · {invoice.data.recipientPhone}
                  </p>
                  <p className="text-muted-foreground">
                    {invoice.data.deliveryAddress}
                  </p>
                  <SummaryLine
                    label={t("subtotal")}
                    value={formatMoney(invoice.data.subtotalAmount, locale)}
                  />
                  <SummaryLine
                    label={t("discount")}
                    value={`− ${formatMoney(invoice.data.discountAmount, locale)}`}
                  />
                  <SummaryLine
                    label={t("shippingFee")}
                    value={formatMoney(invoice.data.shippingFee, locale)}
                  />
                  <div className="border-t pt-2">
                    <SummaryLine
                      label={t("total")}
                      value={formatMoney(invoice.data.totalAmount, locale)}
                      strong
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("invoiceUnavailable")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("deliverySnapshot")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{item.recipientName}</p>
              <p>{item.recipientPhone}</p>
              <p className="leading-6 text-muted-foreground">
                {item.deliveryAddress}
              </p>
              <div className="border-t pt-3 text-sm text-muted-foreground">
                <p>
                  {t("shippingMethod")}: {item.shippingMethodCode ?? "—"}
                </p>
                <p className="mt-1">
                  {t("shippingFee")}: {formatMoney(item.shippingFee, locale)}
                </p>
              </div>
              {item.note ? (
                <p className="border-t pt-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {t("note")}:
                  </span>{" "}
                  {item.note}
                </p>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryLine
                label={t("subtotal")}
                value={formatMoney(item.subtotalAmount, locale)}
              />
              <SummaryLine
                label={t("discount")}
                value={`− ${formatMoney(item.discountAmount, locale)}`}
              />
              <SummaryLine
                label={t("shippingFee")}
                value={formatMoney(item.shippingFee, locale)}
              />
              <div className="border-t pt-3">
                <SummaryLine
                  label={t("total")}
                  value={formatMoney(item.totalAmount, locale)}
                  strong
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <FormError error={update.error ?? paymentStatus.error} />
      {showCancelDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <form
            className="w-full max-w-md space-y-5 rounded-2xl border bg-card p-6 shadow-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              void confirmCancel();
            }}
          >
            <div>
              <p className="eyebrow">{t("orderDetail")}</p>
              <h2 className="mt-2 text-xl font-semibold">
                {t("cancelOrder")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("cancelReasonPrompt")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-cancel-reason">{t("reason")}</Label>
              <Textarea
                id="admin-cancel-reason"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={update.isPending}
              >
                {t("back")}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={update.isPending}
              >
                <Trash2 className="size-4" />
                {t("cancel")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function AdminOrderPaymentRow({
  payment,
  locale,
  mutation,
}: {
  payment: PaymentSummary;
  locale: string;
  mutation: ReturnType<typeof useAdminPaymentStatus>;
}) {
  const t = useTranslations("admin");
  const [providerCode, setProviderCode] = useState(
    payment.providerTransactionCode ?? "",
  );
  const isPending = payment.status === PaymentStatus.Pending;
  const update = (status: string) => {
    if (!payment.id || status === payment.status) return;
    void mutation.mutateAsync({
      id: payment.id,
      status,
      providerTransactionCode: providerCode.trim() || undefined,
    });
  };
  return (
    <div className="rounded-xl border bg-muted/10 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{payment.paymentMethodCode ?? "—"}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {payment.providerTransactionCode ?? t("noTransactionCode")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold">
            {formatMoney(payment.amount, locale)}
          </span>
          <StatusBadge status={payment.status} />
          <Select
            className="h-9 w-36"
            value={payment.status ?? PaymentStatus.Pending}
            onChange={(event) => update(event.target.value)}
            disabled={!payment.id || !isPending || mutation.isPending}
            aria-label={t("paymentStatus")}
          >
            {isPending ? (
              <>
                <option value={PaymentStatus.Pending}>{t("statusValues.PENDING")}</option>
                <option value={PaymentStatus.Paid}>{t("statusValues.PAID")}</option>
                <option value={PaymentStatus.Failed}>{t("statusValues.FAILED")}</option>
              </>
            ) : (
              <option value={payment.status ?? PaymentStatus.Pending}>
                {t.has(`statusValues.${payment.status}`)
                  ? t(`statusValues.${payment.status}`)
                  : payment.status ?? "—"}
              </option>
            )}
          </Select>
        </div>
      </div>
      {isPending ? (
        <div className="mt-3 border-t pt-3">
          <label className="block space-y-1.5 text-xs">
            <span className="font-medium text-muted-foreground">
              {t("providerTransactionCode")}
            </span>
            <Input
              value={providerCode}
              onChange={(event) => setProviderCode(event.target.value)}
              placeholder={t("transactionCodePlaceholder")}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function SummaryLine({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${strong ? "font-semibold" : ""}`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function AdminSupplierDetailPage({
  supplierId,
}: {
  supplierId: string;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const supplier = useAdminSupplier(supplierId);
  const update = useUpdateAdminSupplier();
  const remove = useDeleteAdminSupplier();
  if (supplier.isPending) return <Loading />;
  if (supplier.isError || !supplier.data)
    return (
      <>
        <BackLink href="/admin/suppliers">{t("back")}</BackLink>
        <Failure error={supplier.error} />
      </>
    );
  const item = supplier.data;
  const defaults = {
    name: item.name ?? "",
    email: item.email ?? "",
    phone: item.phone ?? "",
    address: item.address ?? "",
    description: item.description ?? "",
    status: (item.status as EditableResourceStatus | undefined) ?? ResourceStatus.Active,
  };
  return (
    <div>
      <BackLink href="/admin/suppliers">{t("back")}</BackLink>
      <h1 className="mb-8 text-3xl font-semibold">{t("supplierDetail")}</h1>
      <SupplierForm
        defaults={defaults}
        onSave={(request) => update.mutateAsync({ id: supplierId, request })}
        loading={update.isPending}
        error={update.error}
        onDelete={() =>
          remove.mutateAsync(supplierId).then(() => {
            router.push("/admin/suppliers");
          })
        }
        deleteError={remove.error}
      />
    </div>
  );
}

function SupplierForm({
  defaults,
  onSave,
  loading,
  error,
  onDelete,
  deleteError,
}: {
  defaults: {
    name: string;
    email: string;
    phone: string;
    address: string;
    description: string;
    status: EditableResourceStatus;
  };
  onSave: (request: UpdateSupplierRequest) => Promise<unknown>;
  loading: boolean;
  error: unknown;
  onDelete: () => Promise<unknown>;
  deleteError: unknown;
}) {
  const t = useTranslations("admin");
  const [form, setForm] = useState(defaults);
  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSave({
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      description: form.description.trim() || undefined,
      status: form.status,
    });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editSupplier")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => void submit(event)}
        >
          <Field
            id="supplier-name"
            label={t("name")}
            value={form.name}
            onChange={(next) =>
              setForm((current) => ({ ...current, name: next }))
            }
            required
          />
          <Field
            id="supplier-email"
            label={t("email")}
            type="email"
            value={form.email}
            onChange={(next) =>
              setForm((current) => ({ ...current, email: next }))
            }
          />
          <Field
            id="supplier-phone"
            label={t("phone")}
            value={form.phone}
            onChange={(next) =>
              setForm((current) => ({ ...current, phone: next }))
            }
          />
          <Field
            id="supplier-address"
            label={t("address")}
            value={form.address}
            onChange={(next) =>
              setForm((current) => ({ ...current, address: next }))
            }
          />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="supplier-description">{t("description")}</Label>
            <Textarea
              id="supplier-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              <Save className="size-4" />
              {t("save")}
            </Button>
            <Select
              className="w-32"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as EditableResourceStatus,
                }))
              }
            >
              <option value={ResourceStatus.Active}>{t("statusValues.ACTIVE")}</option>
              <option value={ResourceStatus.Inactive}>{t("statusValues.INACTIVE")}</option>
            </Select>
            <ConfirmAction
              title={t("confirmDelete")}
              confirmLabel={t("delete")}
              cancelLabel={t("cancel")}
              onConfirm={onDelete}
              variant="destructive"
            >
              <Trash2 className="size-4" />
              {t("delete")}
            </ConfirmAction>
          </div>
          <FormError error={error ?? deleteError} />
        </form>
      </CardContent>
    </Card>
  );
}

export function AdminInvoicesPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [keyword, setKeyword] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [applied, setApplied] = useState({
    keyword: "",
    fromDate: "",
    toDate: "",
    cursor: undefined as string | undefined,
  });
  const invoices = useInvoices({
    limit: 30,
    cursor: applied.cursor,
    keyword: applied.keyword || undefined,
    fromDate: applied.fromDate ? `${applied.fromDate}T00:00:00Z` : undefined,
    toDate: applied.toDate ? `${applied.toDate}T23:59:59Z` : undefined,
  });
  const reset = () => {
    setKeyword("");
    setFromDate("");
    setToDate("");
    setApplied({ keyword: "", fromDate: "", toDate: "", cursor: undefined });
  };
  const page = invoices.data;
  return (
    <div>
      <div className="mb-8 border-b border-border/70 pb-6">
        <p className="eyebrow">{t("label")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("invoices")}
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {t("resource.invoicesDescription")}
        </p>
      </div>
      <Card className="mb-6">
        <CardContent className="p-4">
          <form
            className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_10rem_auto_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              setApplied({
                keyword: keyword.trim(),
                fromDate,
                toDate,
                cursor: undefined,
              });
            }}
          >
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t("searchInvoices")}
            />
            <Input
              aria-label={t("fromDate")}
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
            <Input
              aria-label={t("toDate")}
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
            <Button type="submit">{t("search")}</Button>
            <Button type="button" variant="outline" onClick={reset}>
              {t("clearFilters")}
            </Button>
          </form>
        </CardContent>
      </Card>
      {invoices.isPending ? (
        <Loading />
      ) : invoices.isError ? (
        <Failure error={invoices.error} />
      ) : (
        <>
          {(page?.items ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
              {t("noResults")}
            </div>
          ) : (
            <div className="space-y-3">
              {(page?.items ?? []).map((invoice, index) => (
                <Card
                  key={invoice.invoiceId ?? invoice.orderId ?? index}
                  className="transition hover:border-primary/30 hover:shadow-md"
                >
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {invoice.invoiceId ?? "—"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {invoice.customerName ?? invoice.recipientName ?? "—"} ·{" "}
                        {invoice.issuedAt
                          ? new Date(invoice.issuedAt).toLocaleDateString(
                              locale === "vi" ? "vi-VN" : "en-US",
                            )
                          : "—"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {invoice.paymentMethodCode ?? "—"} ·{" "}
                        {invoice.paymentStatus ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        {formatMoney(invoice.totalAmount, locale)}
                      </span>
                      {invoice.orderId ? (
                        <Link
                          href={`/admin/orders/${invoice.orderId}`}
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          {t("view")}
                        </Link>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}{" "}
          {page && (page.hasPrev || page.hasNext) ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t("showingItems", {
                  count: page.size ?? page.items?.length ?? 0,
                })}
              </p>
              <AdminPagination
                hasPrev={Boolean(page.hasPrev)}
                hasNext={Boolean(page.hasNext)}
                onPrev={() =>
                  setApplied((current) => ({
                    ...current,
                    cursor: page.prevCursor,
                  }))
                }
                onNext={() =>
                  setApplied((current) => ({
                    ...current,
                    cursor: page.nextCursor,
                  }))
                }
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
