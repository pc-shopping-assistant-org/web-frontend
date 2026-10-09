"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
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
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/navigation";
import type {
  CategoryTree,
  ProductDetail,
  ProductVariant,
} from "@/features/catalog/contracts/responses";
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
} from "@/lib/domain/commerce-enums";
import {ResourceStatus, type EditableResourceStatus} from "@/lib/domain/catalog-enums";
import { CatalogCategoryIcon } from "@/features/catalog/components/catalog-category-icon";
import { AdminPagination } from "./admin-pagination";
import { AdminOrderStatusControl } from "@/features/orders/admin-order-status";
import { useAdminInvoice, useAdminInvoices, useAdminOrder, usePaymentMethods, useShippingMethods } from "@/features/orders/queries";
import { ConfirmAction } from "./confirm-action";
import { FileUploadField, type UploadedFile } from "./file-upload";
import {
  galleryFromProduct,
  galleryRequest,
  optionsRequest,
  ProductGalleryEditor,
  VariantOptionsEditor,
} from "./product-fields";
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
  useAdminProduct,
  useAdminProductStatus,
  useAdminSupplier,
  useAdminDiscountStatus,
  useCreateAdminVariant,
  useDeleteAdminDiscount,
  useDeleteAdminProduct,
  useDeleteAdminSupplier,
  useDeleteAdminVariant,
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
/** The backend sends UTC instants; a datetime-local input shows (and `toIso` reads) the browser's local time. */
function toDateTimeInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function toIso(value: string) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
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
      images: galleryFromProduct(product.images),
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
    let saved;
    try {
      saved = await update.mutateAsync({
        id: product.id!,
        request: {
          name: form.name.trim(),
          seoName: form.seoName.trim(),
          categoryId: form.categoryId,
          brandId: form.brandId || undefined,
          description: form.description.trim() || undefined,
          specifications,
          images: galleryRequest(form.images),
        },
      });
    } catch {
      return;
    }
    setDraft({
      ...form,
      name: saved.name,
      seoName: saved.seoName,
      images: galleryFromProduct(saved.images),
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
          <ProductGalleryEditor
            id="admin-product-gallery"
            items={form.images}
            onChange={(images) => set("images", images)}
          />
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
  const remove = useDeleteAdminVariant();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

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
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted/60">
                      {variant.imageUrl ? (
                        <Image
                          src={variant.imageUrl}
                          alt={variant.sku}
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
                      <p className="font-semibold">{variant.sku}</p>
                      <p className="mt-1 text-sm font-medium">
                        {formatMoney(variant.price, "vi")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("stockLabel")}: {variant.quantity} ·{" "}
                        {t("warranty")}:{" "}
                        {variant.warrantyMonths
                          ? t("warrantyMonthsValue", { count: variant.warrantyMonths })
                          : "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {variant.options
                          .map((option) => `${option.name}: ${option.value}`)
                          .join(" · ") || t("noOptions")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={variant.status} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditingId((current) =>
                          current === variant.id ? null : variant.id,
                        )
                      }
                    >
                      <Pencil className="size-3.5" />
                      {editingId === variant.id ? t("close") : t("edit")}
                    </Button>
                    <ConfirmAction
                      title={t("confirmDelete")}
                      confirmLabel={t("delete")}
                      cancelLabel={t("cancel")}
                      onConfirm={() =>
                        remove.mutateAsync({ productId: product.id, id: variant.id })
                      }
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="size-3.5" />
                      {t("delete")}
                    </ConfirmAction>
                  </div>
                </div>
                {editingId === variant.id ? (
                  <div className="mt-5 border-t pt-5">
                    <VariantForm
                      productId={product.id}
                      variant={variant}
                      onSaved={() => setEditingId(null)}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {createOpen ? (
          <VariantForm productId={product.id} onSaved={() => undefined} />
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Creates a variant, or edits `variant` when it is given. */
function VariantForm({
  productId,
  variant,
  onSaved,
}: {
  productId: string;
  variant?: ProductVariant;
  onSaved: () => void;
}) {
  const t = useTranslations("admin");
  const create = useCreateAdminVariant();
  const update = useUpdateAdminVariant();
  const mutation = variant ? update : create;
  const initial = useMemo(
    () => ({
      sku: variant?.sku ?? "",
      model: variant?.model ?? "",
      barcode: variant?.barcode ?? "",
      releaseAt: variant?.releaseAt ?? "",
      price: variant ? String(variant.price) : "",
      quantity: variant ? String(variant.quantity) : "0",
      warrantyMonths: String(variant?.warrantyMonths ?? 12),
      description: variant?.description ?? "",
      options: (variant?.options ?? []).map(({ name, value }) => ({ name, value })),
      image: variant?.imageFileId
        ? { fileId: variant.imageFileId, url: variant.imageUrl }
        : (null as { fileId: string; url?: string } | null),
      status: (variant?.status as EditableResourceStatus | undefined) ?? ResourceStatus.Active,
    }),
    [variant],
  );
  const [form, setForm] = useState(initial);
  const [formError, setFormError] = useState("");
  const idPrefix = variant ? `variant-${variant.id}` : "variant-new";
  const set = <K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const options = optionsRequest(form.options);
    if (options.some((option) => !option.name || !option.value)) {
      setFormError(t("optionIncomplete"));
      return;
    }
    if (new Set(options.map((option) => option.name.toLowerCase())).size !== options.length) {
      setFormError(t("duplicateOptionType"));
      return;
    }
    const request = {
      sku: form.sku.trim(),
      model: form.model.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      releaseAt: form.releaseAt || undefined,
      price: Number(form.price),
      quantity: Number(form.quantity),
      warrantyMonths: Number(form.warrantyMonths),
      description: form.description.trim() || undefined,
      imageFileId: form.image?.fileId,
      options,
    };
    try {
      if (variant) {
        await update.mutateAsync({ productId, id: variant.id, request: { ...request, status: form.status } });
      } else {
        await create.mutateAsync({ productId, request });
        setForm(initial);
      }
    } catch {
      return;
    }
    onSaved();
  }

  return (
    <form
      className="grid gap-4 rounded-2xl border bg-muted/20 p-4 sm:grid-cols-2"
      onSubmit={(event) => void submit(event)}
    >
      <div className="sm:col-span-2">
        <p className="font-semibold">{variant ? t("editVariant") : t("createVariant")}</p>
        {variant ? null : (
          <p className="mt-1 text-sm text-muted-foreground">{t("variantCreateHint")}</p>
        )}
      </div>
      <Field
        id={`${idPrefix}-sku`}
        label="SKU"
        value={form.sku}
        onChange={(value) => set("sku", value)}
        required
      />
      <Field
        id={`${idPrefix}-model`}
        label={t("model")}
        value={form.model}
        onChange={(value) => set("model", value)}
      />
      <Field
        id={`${idPrefix}-barcode`}
        label={t("barcode")}
        value={form.barcode}
        onChange={(value) => set("barcode", value)}
      />
      <Field
        id={`${idPrefix}-release`}
        label={t("releaseAt")}
        type="date"
        value={form.releaseAt}
        onChange={(value) => set("releaseAt", value)}
      />
      <Field
        id={`${idPrefix}-price`}
        label={t("price")}
        type="number"
        min="0"
        value={form.price}
        onChange={(value) => set("price", value)}
        required
      />
      <Field
        id={`${idPrefix}-quantity`}
        label={t("quantity")}
        type="number"
        min="0"
        value={form.quantity}
        onChange={(value) => set("quantity", value)}
        required
      />
      <Field
        id={`${idPrefix}-warranty`}
        label={t("warrantyMonths")}
        type="number"
        min="1"
        value={form.warrantyMonths}
        onChange={(value) => set("warrantyMonths", value)}
        required
      />
      {variant ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-status`}>{t("status")}</Label>
          <Select
            id={`${idPrefix}-status`}
            value={form.status}
            onChange={(event) => set("status", event.target.value as EditableResourceStatus)}
          >
            <option value={ResourceStatus.Active}>{t("statusValues.ACTIVE")}</option>
            <option value={ResourceStatus.Inactive}>{t("statusValues.INACTIVE")}</option>
          </Select>
        </div>
      ) : null}
      <VariantOptionsEditor
        id={`${idPrefix}-options`}
        rows={form.options}
        onChange={(rows) => set("options", rows)}
      />
      {form.image ? (
        <div className="flex items-center gap-3 rounded-lg border bg-background p-2 sm:col-span-2">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
            {form.image.url ? (
              <Image src={form.image.url} alt="" fill sizes="48px" unoptimized className="object-cover" />
            ) : null}
          </div>
          <span className="min-w-0 flex-1 truncate text-sm">{t("variantImage")}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("removeFile")}
            onClick={() => set("image", null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}
      <FileUploadField
        id={`${idPrefix}-image`}
        label={t("variantImage")}
        onUploaded={(file) => set("image", { fileId: file.id, url: file.publicUrl })}
      />
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-description`}>{t("description")}</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={(event) => set("description", event.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={mutation.isPending || !form.sku.trim() || !form.price}>
          {variant ? <Save className="size-4" /> : <Plus className="size-4" />}
          {variant ? t("save") : t("create")}
        </Button>
      </div>
      <div className="sm:col-span-2">
        <FormError error={mutation.error} formError={formError} />
      </div>
    </form>
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
      categoryIds: discount?.categoryIds ?? [],
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
      value.applicationScope === DiscountScope.Category &&
      value.categoryIds.length === 0
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
      categoryIds:
        value.applicationScope === DiscountScope.Category ? value.categoryIds : [],
    };
    if (!discount?.id) return;
    try {
      const saved = await update.mutateAsync({ id: discount.id, request });
      setForm({ ...value, startAt: toDateTimeInput(saved.startAt), endAt: toDateTimeInput(saved.endAt) });
    } catch {
      // the failed mutation shows its own error
    }
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
                  options={[DiscountStatus.Active, DiscountStatus.Inactive]}
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
            error={update.error ?? status.error}
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
  const paymentMethods = usePaymentMethods();
  const shippingMethods = useShippingMethods();
  if (order.isPending) return <Loading />;
  if (order.isError || !order.data)
    return (
      <>
        <BackLink href="/admin/orders">{t("back")}</BackLink>
        <Failure error={order.error} />
      </>
    );
  const item = order.data;
  const dateTime = (value?: string) =>
    value ? new Date(value).toLocaleString(locale === "vi" ? "vi-VN" : "en-US") : "—";
  const statusLabel = (status: string) =>
    t.has(`statusValues.${status}`) ? t(`statusValues.${status}`) : status;
  const cancellation = item.status === OrderStatus.Cancelled
    ? item.statusHistory.findLast((change) => change.toStatus === OrderStatus.Cancelled)
    : undefined;
  const shippingMethod = shippingMethods.data?.find((method) => method.id === item.shippingMethodId);
  return (
    <div>
      <BackLink href="/admin/orders">{t("back")}</BackLink>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("orderDetail")}</p>
          <h1 className="mt-2 text-3xl font-semibold">{item.invoiceNumber}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {dateTime(item.createdAt)}
            {item.customerId ? ` · ${t("customerId")}: ${item.customerId}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={item.status} />
          <AdminOrderStatusControl orderId={orderId} status={item.status} className="w-52" />
          {item.status === OrderStatus.Completed ? (
            <Link
              href={`/admin/invoices/${orderId}`}
              className="inline-flex h-9 items-center rounded-lg border bg-background px-3 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
            >
              {t("viewInvoice")}
            </Link>
          ) : null}
        </div>
      </div>
      {cancellation ? (
        <p className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <span className="font-medium">{t("cancellationReason")}:</span>{" "}
          {cancellation.reason ?? "—"}
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("items")}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {item.items.length ? (
                item.items.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{line.productName}</p>
                      {line.variantLabel ? (
                        <p className="text-sm text-muted-foreground">{line.variantLabel}</p>
                      ) : null}
                      <p className="text-sm text-muted-foreground">
                        {line.sku ? `${line.sku} · ` : ""}
                        {line.quantity} × {formatMoney(line.unitPrice, locale)}
                      </p>
                      {line.discountAmount > 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("itemDiscount")}: − {formatMoney(line.discountAmount, locale)}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-right font-semibold">
                      <span className="block text-xs font-normal text-muted-foreground">
                        {t("itemNet")}
                      </span>
                      {formatMoney(line.lineTotal, locale)}
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
              {item.payments.length ? (
                item.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/10 p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {paymentMethods.data?.find((method) => method.id === payment.paymentMethodId)?.name ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {payment.paidAt ? `${t("paidAt")}: ${dateTime(payment.paidAt)}` : dateTime(payment.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatMoney(payment.amount, locale)}</span>
                      <StatusBadge status={payment.status} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("noPayments")}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("statusHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              {item.statusHistory.length ? (
                <ol className="space-y-4 border-l pl-4">
                  {[...item.statusHistory].reverse().map((change, index) => (
                    <li key={`${change.toStatus}-${change.createdAt}-${index}`} className="text-sm">
                      <p className="font-medium">
                        {change.fromStatus ? `${statusLabel(change.fromStatus)} → ` : ""}
                        {statusLabel(change.toStatus)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dateTime(change.createdAt)} · {change.changedBy ? t("changedByStaff") : t("changedBySystem")}
                      </p>
                      {change.reason ? (
                        <p className="mt-1 text-muted-foreground">{t("reason")}: {change.reason}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">{t("noStatusHistory")}</p>
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
                  {t("shippingMethod")}: {shippingMethod?.name ?? "—"}
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
              {item.deliveredAt ? (
                <p className="border-t pt-3 text-xs text-muted-foreground">
                  {t("deliveredAt")}: {dateTime(item.deliveredAt)}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
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
  const [draft, setDraft] = useState({ keyword: "", fromDate: "", toDate: "" });
  const [applied, setApplied] = useState(draft);
  const [pageNumber, setPageNumber] = useState(0);
  const invoices = useAdminInvoices({
    page: pageNumber,
    size: 20,
    keyword: applied.keyword || undefined,
    invoiceFrom: applied.fromDate ? `${applied.fromDate}T00:00:00Z` : undefined,
    invoiceTo: applied.toDate ? `${applied.toDate}T23:59:59Z` : undefined,
  });
  const reset = () => {
    const empty = { keyword: "", fromDate: "", toDate: "" };
    setDraft(empty);
    setApplied(empty);
    setPageNumber(0);
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
              setApplied({ ...draft, keyword: draft.keyword.trim() });
              setPageNumber(0);
            }}
          >
            <Input
              value={draft.keyword}
              onChange={(event) =>
                setDraft((current) => ({ ...current, keyword: event.target.value }))
              }
              placeholder={t("searchInvoices")}
            />
            <Input
              aria-label={t("fromDate")}
              type="date"
              value={draft.fromDate}
              onChange={(event) =>
                setDraft((current) => ({ ...current, fromDate: event.target.value }))
              }
            />
            <Input
              aria-label={t("toDate")}
              type="date"
              value={draft.toDate}
              onChange={(event) =>
                setDraft((current) => ({ ...current, toDate: event.target.value }))
              }
            />
            <Button type="submit" size="field">{t("search")}</Button>
            <Button type="button" size="field" variant="outline" onClick={reset}>
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
              {(page?.items ?? []).map((invoice) => (
                <Card
                  key={invoice.id}
                  className="transition hover:border-primary/30 hover:shadow-md"
                >
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="font-semibold hover:text-primary hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {invoice.recipientName ?? "—"} ·{" "}
                        {invoice.invoiceDate
                          ? new Date(invoice.invoiceDate).toLocaleDateString(
                              locale === "vi" ? "vi-VN" : "en-US",
                            )
                          : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        {formatMoney(invoice.totalAmount, locale)}
                      </span>
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        {t("view")}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {page && page.totalPages > 1 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t("pageOf", { page: page.page + 1, total: page.totalPages })}
                {" · "}
                {t("totalInvoices", { count: page.totalElements })}
              </p>
              <AdminPagination
                hasPrev={page.page > 0}
                hasNext={!page.last}
                onPrev={() => setPageNumber((current) => Math.max(0, current - 1))}
                onNext={() => setPageNumber((current) => current + 1)}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export function AdminInvoiceDetailPage({ orderId }: { orderId: string }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const invoice = useAdminInvoice(orderId);
  if (invoice.isPending) return <Loading />;
  if (invoice.isError || !invoice.data)
    return (
      <>
        <BackLink href="/admin/invoices">{t("back")}</BackLink>
        <Failure error={invoice.error} />
      </>
    );
  const item = invoice.data;
  return (
    <div>
      <BackLink href="/admin/invoices">{t("back")}</BackLink>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("invoiceDetail")}</p>
          <h1 className="mt-2 text-3xl font-semibold">{item.invoiceNumber}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {item.invoiceDate
              ? new Date(item.invoiceDate).toLocaleString(locale === "vi" ? "vi-VN" : "en-US")
              : "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/orders/${item.id}`}
            className="inline-flex h-9 items-center rounded-lg border bg-background px-3 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
          >
            {t("viewOrder")}
          </Link>
          <Button type="button" size="sm" variant="outline" onClick={() => window.print()}>
            {t("printInvoice")}
          </Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>{t("items")}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {item.items.map((line) => (
              <div
                key={line.id}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium">{line.productName}</p>
                  {line.variantLabel ? (
                    <p className="text-sm text-muted-foreground">{line.variantLabel}</p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    {line.sku ? `${line.sku} · ` : ""}
                    {line.quantity} × {formatMoney(line.unitPrice, locale)}
                  </p>
                  {line.discountAmount > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("itemDiscount")}: − {formatMoney(line.discountAmount, locale)}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 font-semibold">
                  {formatMoney(line.lineTotal, locale)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("deliverySnapshot")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{item.recipientName ?? "—"}</p>
              <p>{item.recipientPhone}</p>
              <p className="leading-6 text-muted-foreground">{item.deliveryAddress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryLine label={t("subtotal")} value={formatMoney(item.subtotalAmount, locale)} />
              <SummaryLine label={t("discount")} value={`− ${formatMoney(item.discountAmount, locale)}`} />
              <SummaryLine label={t("shippingFee")} value={formatMoney(item.shippingFee, locale)} />
              <div className="border-t pt-3">
                <SummaryLine label={t("total")} value={formatMoney(item.totalAmount, locale)} strong />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

