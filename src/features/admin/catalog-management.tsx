"use client";

import Image from "next/image";
import { Building2, ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelectList } from "@/components/ui/multi-select-list";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import type {Brand, CategoryTree} from "@/features/catalog/contracts/responses";
import type {UpdateBrandRequest, UpdateCategoryRequest} from "@/features/admin/contracts/requests";
import {ResourceStatus, type EditableResourceStatus} from "@/lib/domain/catalog-enums";

import { useBrands, useCategories } from "@/features/catalog/queries";
import { ConfirmAction } from "./confirm-action";
import { FileUploadField, type UploadedFile } from "./file-upload";
import { SpecificationsEditor } from "./specifications-editor";
import {
  useAdminSuppliers,
  useCreateAdminBrand,
  useCreateAdminCategory,
  useCreateAdminProduct,
  useDeleteAdminBrand,
  useDeleteAdminCategory,
  useUpdateAdminBrand,
  useUpdateAdminCategory,
} from "./queries";

function CreateCardHeader({
  title,
  description,
  open,
  onToggle,
}: {
  title: string;
  description?: string;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("admin");
  return (
    <CardHeader className="flex-row items-center justify-between gap-4">
      <div className="min-w-0">
        <CardTitle>{title}</CardTitle>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={open}
        onClick={onToggle}
      >
        {open ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
        {open ? t("hideCreate") : t("openCreate")}
      </Button>
    </CardHeader>
  );
}

export function CategoryManagement() {
  const t = useTranslations("admin");
  const categories = useCategories();
  const create = useCreateAdminCategory();
  const remove = useDeleteAdminCategory();
  const update = useUpdateAdminCategory();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", seoName: "", parentId: "" });
  const [editing, setEditing] = useState<CategoryTree | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    await create.mutateAsync({
      name: form.name.trim(),
      seoName: form.seoName.trim(),
      parentId: form.parentId || undefined,
    });
    setForm({ name: "", seoName: "", parentId: "" });
  }
  const flat = flatten(categories.data ?? []);
  return (
    <section className="space-y-6">
      <div className="mb-8 border-b border-border/70 pb-6">
        <p className="eyebrow">{t("label")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("nav.categories")}
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {t("categoriesDescription")}
        </p>
      </div>
      <Card>
        <CreateCardHeader
          title={t("createCategory")}
          open={open}
          onToggle={() => setOpen((value) => !value)}
        />
        {open ? (
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-3"
              onSubmit={(event) => void submit(event)}
            >
              <Field
                id="category-name"
                label={t("name")}
                value={form.name}
                onChange={(value) =>
                  setForm((current) => ({ ...current, name: value }))
                }
                required
              />
              <Field
                id="category-seo"
                label={t("seoName")}
                value={form.seoName}
                onChange={(value) =>
                  setForm((current) => ({ ...current, seoName: value }))
                }
                required
              />
              <div className="space-y-2">
                <Label htmlFor="category-parent">{t("parentCategory")}</Label>
                <Select
                  id="category-parent"
                  value={form.parentId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      parentId: event.target.value,
                    }))
                  }
                >
                  <option value="">{t("rootCategory")}</option>
                  {flat.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="submit"
                className="md:col-span-3"
                disabled={create.isPending}
              >
                <Plus className="size-4" />
                {t("create")}
              </Button>
              {create.isError ? (
                <div className="md:col-span-3">
                  <ErrorMessage error={create.error} />
                </div>
              ) : null}
            </form>
          </CardContent>
        ) : null}
      </Card>
      {editing ? (
        <CategoryEditForm
          category={editing}
          categories={flat}
          onClose={() => setEditing(null)}
          onSave={(request) => update.mutateAsync({ id: editing.id!, request })}
          loading={update.isPending}
          error={update.error}
        />
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{t("categoryTree")}</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.isPending ? (
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          ) : categories.isError ? (
            <ErrorMessage error={categories.error} />
          ) : flat.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              {t("noResults")}
            </p>
          ) : (
            <div className="space-y-2">
              {flat.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="min-w-0 truncate">{category.label}</span>
                    <StatusBadge
                      status={
                        (categories.data ?? [])
                          .map((root) => findCategory(root, category.id))
                          .find(Boolean)?.status
                      }
                    />
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() =>
                        setEditing(
                          (categories.data ?? []).flatMap((item) =>
                            findCategory(item, category.id)
                              ? [findCategory(item, category.id)!]
                              : [],
                          )[0] ?? {
                            id: category.id,
                            name: category.label.replace(/^—+\s*/, ""),
                            seoName: "",
                            parentId: undefined,
                          },
                        )
                      }
                      aria-label={t("editCategory")}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <ConfirmAction
                      title={t("delete")}
                      description={t("confirmDelete")}
                      confirmLabel={t("delete")}
                      cancelLabel={t("cancel")}
                      onConfirm={() => remove.mutateAsync(category.id)}
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={t("delete")}
                    >
                      <Trash2 className="size-4" />
                    </ConfirmAction>
                  </div>
                </div>
              ))}
            </div>
          )}
          {remove.isError ? (
            <div className="mt-4">
              <ErrorMessage error={remove.error} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

function findCategory(
  category: CategoryTree,
  id?: string,
): CategoryTree | null {
  if (category.id === id) return category;
  for (const child of category.children ?? []) {
    const found = findCategory(child, id);
    if (found) return found;
  }
  return null;
}
function CategoryEditForm({
  category,
  categories,
  onClose,
  onSave,
  loading,
  error,
}: {
  category: CategoryTree;
  categories: { id: string; label: string }[];
  onClose: () => void;
  onSave: (request: UpdateCategoryRequest) => Promise<unknown>;
  loading: boolean;
  error: unknown;
}) {
  const t = useTranslations("admin");
  const [form, setForm] = useState({
    name: category.name ?? "",
    seoName: category.seoName ?? "",
    parentId: category.parentId ?? "",
    status: (category.status as EditableResourceStatus | undefined) ?? ResourceStatus.Active,
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSave({
      name: form.name.trim(),
      seoName: form.seoName.trim(),
      parentId: form.parentId || undefined,
      status: form.status,
    });
    onClose();
  }
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t("editCategory")}</CardTitle>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onClose}
          aria-label={t("close")}
        >
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-4"
          onSubmit={(event) => void submit(event)}
        >
          <Field
            id="edit-category-name"
            label={t("name")}
            value={form.name}
            onChange={(value) =>
              setForm((current) => ({ ...current, name: value }))
            }
            required
          />
          <Field
            id="edit-category-seo"
            label={t("seoName")}
            value={form.seoName}
            onChange={(value) =>
              setForm((current) => ({ ...current, seoName: value }))
            }
            required
          />
          <Select
            value={form.parentId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                parentId: event.target.value,
              }))
            }
          >
            <option value="">{t("rootCategory")}</option>
            {categories
              .filter((item) => item.id !== category.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
          </Select>
          <Select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value as EditableResourceStatus }))
            }
          >
            <option value={ResourceStatus.Active}>{t("statusValues.ACTIVE")}</option>
            <option value={ResourceStatus.Inactive}>{t("statusValues.INACTIVE")}</option>
          </Select>
          <div className="flex gap-2 md:col-span-4">
            <Button type="submit" disabled={loading}>
              {t("save")}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
          </div>
          {error ? (
            <div className="md:col-span-4">
              <ErrorMessage error={error} />
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

export function BrandManagement() {
  const t = useTranslations("admin");
  const brands = useBrands();
  const create = useCreateAdminBrand();
  const remove = useDeleteAdminBrand();
  const update = useUpdateAdminBrand();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    file: null as UploadedFile | null,
  });
  const [editing, setEditing] = useState<Brand | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    await create.mutateAsync({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      fileId: form.file?.id,
    });
    setForm({ name: "", description: "", file: null });
  }
  return (
    <section className="space-y-6">
      <div className="mb-8 border-b border-border/70 pb-6">
        <p className="eyebrow">{t("label")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("nav.brands")}
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {t("brandsDescription")}
        </p>
      </div>
      <Card>
        <CreateCardHeader
          title={t("createBrand")}
          open={open}
          onToggle={() => setOpen((value) => !value)}
        />
        {open ? (
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => void submit(event)}
            >
              <Field
                id="brand-name"
                label={t("name")}
                value={form.name}
                onChange={(value) =>
                  setForm((current) => ({ ...current, name: value }))
                }
                required
              />
              <FileUploadField
                id="brand-file"
                label={t("brandLogo")}
                value={form.file ? [form.file] : []}
                onUploaded={(file) =>
                  setForm((current) => ({ ...current, file }))
                }
                onRemove={() =>
                  setForm((current) => ({ ...current, file: null }))
                }
              />
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="brand-description">{t("description")}</Label>
                <Textarea
                  id="brand-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <Button
                type="submit"
                className="sm:col-span-2"
                disabled={create.isPending}
              >
                <Plus className="size-4" />
                {t("create")}
              </Button>
              {create.isError ? (
                <div className="sm:col-span-2">
                  <ErrorMessage error={create.error} />
                </div>
              ) : null}
            </form>
          </CardContent>
        ) : null}
      </Card>
      {editing ? (
        <BrandEditForm
          brand={editing}
          onClose={() => setEditing(null)}
          onSave={(request) => update.mutateAsync({ id: editing.id!, request })}
          loading={update.isPending}
          error={update.error}
        />
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{t("brands")}</CardTitle>
        </CardHeader>
        <CardContent>
          {brands.isPending ? (
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          ) : brands.isError ? (
            <ErrorMessage error={brands.error} />
          ) : (
            <div className="space-y-2">
              {(brands.data ?? []).map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {brand.logoUrl ? (
                      <Image
                        src={brand.logoUrl}
                        alt=""
                        width={36}
                        height={36}
                        unoptimized
                        className="size-9 rounded-lg object-contain"
                      />
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Building2 className="size-4" aria-hidden="true" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {brand.name}
                      </span>
                      <StatusBadge status={brand.status} />
                    </span>
                  </div>
                  {brand.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setEditing(brand)}
                        aria-label={t("editBrand")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <ConfirmAction
                        title={t("delete")}
                        description={t("confirmDelete")}
                        confirmLabel={t("delete")}
                        cancelLabel={t("cancel")}
                        onConfirm={() => remove.mutateAsync(brand.id!)}
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        aria-label={t("delete")}
                      >
                        <Trash2 className="size-4" />
                      </ConfirmAction>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {remove.isError ? (
            <div className="mt-4">
              <ErrorMessage error={remove.error} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

function BrandEditForm({
  brand,
  onClose,
  onSave,
  loading,
  error,
}: {
  brand: Brand;
  onClose: () => void;
  onSave: (request: UpdateBrandRequest) => Promise<unknown>;
  loading: boolean;
  error: unknown;
}) {
  const t = useTranslations("admin");
  const [form, setForm] = useState({
    name: brand.name ?? "",
    description: brand.description ?? "",
    file: brand.imageFileId
      ? ({ id: brand.imageFileId } as UploadedFile)
      : null,
    status: (brand.status as EditableResourceStatus | undefined) ?? ResourceStatus.Active,
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSave({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      fileId: form.file?.id,
      status: form.status,
    });
    onClose();
  }
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t("editBrand")}</CardTitle>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onClose}
          aria-label={t("close")}
        >
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => void submit(event)}
        >
          <Field
            id="edit-brand-name"
            label={t("name")}
            value={form.name}
            onChange={(value) =>
              setForm((current) => ({ ...current, name: value }))
            }
            required
          />
          <FileUploadField
            id="edit-brand-file"
            label={t("brandLogo")}
            currentFileId={
              brand.imageFileId && !form.file?.originalName
                ? brand.imageFileId
                : undefined
            }
            value={form.file?.originalName ? [form.file] : []}
            onUploaded={(file) => setForm((current) => ({ ...current, file }))}
            onRemove={() => setForm((current) => ({ ...current, file: null }))}
          />
          <div className="space-y-2">
            <Label htmlFor="edit-brand-status">{t("status")}</Label>
            <Select
              id="edit-brand-status"
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
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="edit-brand-description">{t("description")}</Label>
            <Textarea
              id="edit-brand-description"
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
              {t("save")}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
          </div>
          {error ? (
            <div className="sm:col-span-2">
              <ErrorMessage error={error} />
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

export function ProductCreateForm() {
  const t = useTranslations("admin");
  const router = useRouter();
  const categories = useCategories();
  const brands = useBrands();
  const suppliers = useAdminSuppliers({ limit: 100, status: ResourceStatus.Active });
  const create = useCreateAdminProduct();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    seoName: "",
    categoryId: "",
    brandId: "",
    description: "",
    specifications: "{}",
    supplierIds: [] as string[],
  });
  const [formError, setFormError] = useState("");
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
    if (
      !specifications ||
      Array.isArray(specifications) ||
      typeof specifications !== "object"
    ) {
      setFormError(t("specificationsObjectRequired"));
      return;
    }
    const created = await create.mutateAsync({
      name: form.name.trim(),
      seoName: form.seoName.trim(),
      categoryId: form.categoryId,
      brandId: form.brandId || undefined,
      description: form.description.trim() || undefined,
      specifications,
      supplierIds: form.supplierIds,
    });
    setForm({
      name: "",
      seoName: "",
      categoryId: "",
      brandId: "",
      description: "",
      specifications: "{}",
      supplierIds: [],
    });
    if (created?.id) router.push(`/admin/products/${created.id}`);
  }
  return (
    <Card className="mb-6">
      <CreateCardHeader
        title={t("createProduct")}
        description={t("productCreateDescription")}
        open={open}
        onToggle={() => setOpen((value) => !value)}
      />
      {open ? (
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => void submit(event)}
          >
            <Field
              id="product-name"
              label={t("name")}
              value={form.name}
              onChange={(value) =>
                setForm((current) => ({ ...current, name: value }))
              }
              required
            />
            <Field
              id="product-seo"
              label={t("seoName")}
              value={form.seoName}
              onChange={(value) =>
                setForm((current) => ({ ...current, seoName: value }))
              }
              required
            />
            <div className="space-y-2">
              <Label htmlFor="product-category">{t("category")}</Label>
              <Select
                id="product-category"
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
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
              <Label htmlFor="product-brand">{t("brand")}</Label>
              <Select
                id="product-brand"
                value={form.brandId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    brandId: event.target.value,
                  }))
                }
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
              id="product-suppliers"
              label={t("suppliers")}
              hint={t("supplierHint")}
              options={(suppliers.data?.items ?? [])
                .filter((supplier) => supplier.id)
                .map((supplier) => ({
                  value: supplier.id!,
                  label: supplier.name ?? supplier.id!,
                  description: supplier.email ?? supplier.phone,
                }))}
              value={form.supplierIds}
              onChange={(value) =>
                setForm((current) => ({ ...current, supplierIds: value }))
              }
              selectedLabel={t("selectedCount", {count: form.supplierIds.length})}
              emptyLabel={t("noSuppliers")}
              className="sm:col-span-2"
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="product-description">{t("description")}</Label>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <SpecificationsEditor
              categoryId={form.categoryId}
              value={form.specifications}
              onChange={(value) =>
                setForm((current) => ({ ...current, specifications: value }))
              }
              idPrefix="product"
            />
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button
                type="submit"
                disabled={
                  create.isPending ||
                  !form.categoryId ||
                  !form.name.trim() ||
                  !form.seoName.trim()
                }
              >
                <Plus className="size-4" />
                {t("create")}
              </Button>
              {formError ? (
                <p className="self-center text-sm text-destructive">
                  {formError}
                </p>
              ) : null}
              {create.isError ? <ErrorMessage error={create.error} /> : null}
            </div>
          </form>
        </CardContent>
      ) : null}
    </Card>
  );
}

function Field({
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
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </div>
  );
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
