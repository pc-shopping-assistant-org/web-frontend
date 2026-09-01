"use client";

import { ChevronDown, ChevronUp, Plus, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelectList } from "@/components/ui/multi-select-list";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type {CategoryTree} from "@/features/catalog/contracts/responses";
import {Gender} from "@/lib/domain/account-enums";
import {DiscountScope, DiscountType} from "@/lib/domain/commerce-enums";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

import { useCategories } from "@/features/catalog/queries";
import { FileUploadField, type UploadedFile } from "./file-upload";
import {
  useCreateAdminDiscount,
  useCreateAdminEmployee,
  useAdminProduct,
  useAdminProducts,
  useCreateAdminSupplier,
  useRoles,
} from "./queries";

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
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
        disabled={disabled}
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
function iso(value: string) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

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
        {description ? <CardDescription>{description}</CardDescription> : null}
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

export function EmployeeCreateForm() {
  const t = useTranslations("admin");
  const roles = useRoles();
  const create = useCreateAdminEmployee();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    gender: Gender.Male as Gender.Male | Gender.Female,
    roleId: "",
    salary: "0",
    joinedAt: "",
    birthday: "",
    address: "",
    avatarFile: null as UploadedFile | null,
  });
  function set(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    await create.mutateAsync({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      gender: form.gender,
      roleId: form.roleId,
      salary: Number(form.salary),
      joinedAt: form.joinedAt || undefined,
      birthday: form.birthday || undefined,
      address: form.address.trim() || undefined,
      avatarFileId: form.avatarFile?.id,
    });
    setForm({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      gender: Gender.Male as Gender.Male | Gender.Female,
      roleId: "",
      salary: "0",
      joinedAt: "",
      birthday: "",
      address: "",
      avatarFile: null,
    });
  }
  return (
    <Card className="mb-6">
      <CreateCardHeader
        title={t("createEmployee")}
        description={t("employeeCreateDescription")}
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
              id="new-employee-name"
              label={t("fullName")}
              value={form.fullName}
              onChange={(value) => set("fullName", value)}
              required
            />
            <Field
              id="new-employee-email"
              label={t("email")}
              type="email"
              value={form.email}
              onChange={(value) => set("email", value)}
              required
            />
            <Field
              id="new-employee-phone"
              label={t("phone")}
              value={form.phone}
              onChange={(value) => set("phone", value)}
              required
            />
            <Field
              id="new-employee-password"
              label={t("initialPassword")}
              type="password"
              value={form.password}
              onChange={(value) => set("password", value)}
              required
            />
            <div className="space-y-2">
              <Label htmlFor="new-employee-role">{t("role")}</Label>
              <Select
                id="new-employee-role"
                value={form.roleId}
                onChange={(event) => set("roleId", event.target.value)}
                required
              >
                <option value="">{t("chooseRole")}</option>
                {(roles.data ?? []).map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-employee-gender">{t("gender")}</Label>
              <Select
                id="new-employee-gender"
                value={form.gender}
                onChange={(event) => set("gender", event.target.value)}
              >
                <option value={Gender.Male}>{t("male")}</option>
                <option value={Gender.Female}>{t("female")}</option>
              </Select>
            </div>
            <Field
              id="new-employee-salary"
              label={t("salary")}
              type="number"
              value={form.salary}
              onChange={(value) => set("salary", value)}
            />
            <Field
              id="new-employee-joined"
              label={t("joinedAt")}
              type="date"
              value={form.joinedAt}
              onChange={(value) => set("joinedAt", value)}
            />
            <Field
              id="new-employee-birthday"
              label={t("birthday")}
              type="date"
              value={form.birthday}
              onChange={(value) => set("birthday", value)}
            />
            <FileUploadField
              id="new-employee-avatar"
              label={t("avatar")}
              value={form.avatarFile ? [form.avatarFile] : []}
              onUploaded={(file) =>
                setForm((current) => ({ ...current, avatarFile: file }))
              }
              onRemove={() =>
                setForm((current) => ({ ...current, avatarFile: null }))
              }
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-employee-address">{t("address")}</Label>
              <Textarea
                id="new-employee-address"
                value={form.address}
                onChange={(event) => set("address", event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={create.isPending || !form.roleId}>
                <Plus className="size-4" />
                {t("create")}
              </Button>
            </div>
            {create.isError ? (
              <div className="sm:col-span-2">
                <ErrorMessage error={create.error} />
              </div>
            ) : null}
          </form>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function SupplierCreateForm() {
  const t = useTranslations("admin");
  const create = useCreateAdminSupplier();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    await create.mutateAsync({
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      description: form.description.trim() || undefined,
    });
    setForm({ name: "", email: "", phone: "", address: "", description: "" });
  }
  return (
    <Card className="mb-6">
      <CreateCardHeader
        title={t("createSupplier")}
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
              id="new-supplier-name"
              label={t("name")}
              value={form.name}
              onChange={(value) =>
                setForm((current) => ({ ...current, name: value }))
              }
              required
            />
            <Field
              id="new-supplier-email"
              label={t("email")}
              type="email"
              value={form.email}
              onChange={(value) =>
                setForm((current) => ({ ...current, email: value }))
              }
            />
            <Field
              id="new-supplier-phone"
              label={t("phone")}
              value={form.phone}
              onChange={(value) =>
                setForm((current) => ({ ...current, phone: value }))
              }
            />
            <Field
              id="new-supplier-address"
              label={t("address")}
              value={form.address}
              onChange={(value) =>
                setForm((current) => ({ ...current, address: value }))
              }
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-supplier-description">
                {t("description")}
              </Label>
              <Textarea
                id="new-supplier-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={create.isPending || !form.name.trim()}
              >
                <Plus className="size-4" />
                {t("create")}
              </Button>
            </div>
            {create.isError ? (
              <div className="sm:col-span-2">
                <ErrorMessage error={create.error} />
              </div>
            ) : null}
          </form>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function DiscountCreateForm() {
  const t = useTranslations("admin");
  const categories = useCategories();
  const create = useCreateAdminDiscount();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    code: "",
    discountType: DiscountType.Percent,
    value: "10",
    applicationScope: DiscountScope.Order,
    minOrderAmount: "0",
    startAt: "",
    endAt: "",
    description: "",
    categoryIds: [] as string[],
    variantIds: [] as string[],
  });
  function set(key: keyof typeof form, value: string | string[]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    await create.mutateAsync({
      title: form.title.trim(),
      code: form.code.trim() || undefined,
      discountType: form.discountType,
      value: Number(form.value),
      applicationScope: form.applicationScope,
      minOrderAmount: Number(form.minOrderAmount),
      startAt: iso(form.startAt),
      endAt: iso(form.endAt),
      description: form.description.trim() || undefined,
      appliedCategoryIds:
      form.applicationScope === DiscountScope.Category ? form.categoryIds : [],
      appliedVariantIds:
      form.applicationScope === DiscountScope.Variant ? form.variantIds : [],
    });
    setForm({
      title: "",
      code: "",
      discountType: DiscountType.Percent,
      value: "10",
      applicationScope: DiscountScope.Order,
      minOrderAmount: "0",
      startAt: "",
      endAt: "",
      description: "",
      categoryIds: [],
      variantIds: [],
    });
  }
  const targetError =
    (form.applicationScope === DiscountScope.Category && form.categoryIds.length === 0) ||
    (form.applicationScope === DiscountScope.Variant && form.variantIds.length === 0);
  return (
    <Card className="mb-6">
      <CreateCardHeader
        title={t("createDiscount")}
        description={t("discountTargetDescription")}
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
              id="new-discount-title"
              label={t("titleField")}
              value={form.title}
              onChange={(value) => set("title", value)}
              required
            />
            <Field
              id="new-discount-code"
              label={t("code")}
              value={form.code}
              onChange={(value) => set("code", value)}
              disabled={form.applicationScope !== DiscountScope.Order}
            />
            <div className="space-y-2">
              <Label htmlFor="new-discount-type">{t("discountType")}</Label>
              <Select
                id="new-discount-type"
                value={form.discountType}
                onChange={(event) => set("discountType", event.target.value)}
              >
                <option value={DiscountType.Percent}>{t("discountTypeValues.PERCENT")}</option>
                <option value={DiscountType.Fixed}>{t("discountTypeValues.FIXED")}</option>
              </Select>
            </div>
            <Field
              id="new-discount-value"
              label={t("value")}
              type="number"
              value={form.value}
              onChange={(value) => set("value", value)}
              required
            />
            <Field
              id="new-discount-start"
              label={t("startAt")}
              type="datetime-local"
              value={form.startAt}
              onChange={(value) => set("startAt", value)}
              required
            />
            <Field
              id="new-discount-end"
              label={t("endAt")}
              type="datetime-local"
              value={form.endAt}
              onChange={(value) => set("endAt", value)}
              required
            />
            <Field
              id="new-discount-min"
              label={t("minOrderAmount")}
              type="number"
              value={form.minOrderAmount}
              onChange={(value) => set("minOrderAmount", value)}
            />
            <div className="space-y-2">
              <Label htmlFor="new-discount-scope">
                {t("applicationScope")}
              </Label>
              <Select
                id="new-discount-scope"
                value={form.applicationScope}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    applicationScope: event.target.value as DiscountScope,
                    code:
                      event.target.value === DiscountScope.Order ? current.code : "",
                  }))
                }
              >
                <option value={DiscountScope.Order}>{t("scopeValues.ORDER")}</option>
                <option value={DiscountScope.AllItems}>{t("scopeValues.ALL_ITEMS")}</option>
                <option value={DiscountScope.Category}>{t("scopeValues.CATEGORY")}</option>
                <option value={DiscountScope.Variant}>{t("scopeValues.VARIANT")}</option>
              </Select>
            </div>
            {form.applicationScope === DiscountScope.Category ? (
              <MultiSelectList
                id="new-discount-categories"
                label={t("targetCategories")}
                hint={t("targetCategoriesHint")}
                options={flatten(categories.data ?? []).map((category) => ({
                  value: category.id,
                  label: category.label,
                }))}
                value={form.categoryIds}
                onChange={(value) => set("categoryIds", value)}
                selectedLabel={t("selectedCount", {count: form.categoryIds.length})}
                emptyLabel={t("noCategories")}
                className="sm:col-span-2"
              />
            ) : null}
            {form.applicationScope === DiscountScope.Variant ? (
              <VariantTargetPicker
                value={form.variantIds}
                onChange={(value) => set("variantIds", value)}
              />
            ) : null}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-discount-description">
                {t("description")}
              </Label>
              <Textarea
                id="new-discount-description"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={create.isPending || targetError}>
                <Plus className="size-4" />
                {t("create")}
              </Button>
            </div>
            {create.isError ? (
              <div className="sm:col-span-2">
                <ErrorMessage error={create.error} />
              </div>
            ) : null}
          </form>
        </CardContent>
      ) : null}
    </Card>
  );
}

/**
 * Selects variants through the catalog instead of asking operators to copy
 * UUIDs. Selected IDs are retained while switching products so a promotion
 * can target variants from more than one product.
 */
export function VariantTargetPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const t = useTranslations("admin");
  const [productId, setProductId] = useState("");
  const [keyword, setKeyword] = useState("");
  const products = useAdminProducts({
    limit: 100,
    status: ResourceStatus.Active,
    keyword: keyword.trim() || undefined,
  });
  const product = useAdminProduct(productId);
  const variants = useMemo(
    () =>
      (product.data?.variants ?? []).filter(
        (variant) => variant.id && variant.status === ResourceStatus.Active,
      ),
    [product.data?.variants],
  );
  const currentProductVariantIds = useMemo(
    () => new Set(variants.flatMap((variant) => (variant.id ? [variant.id] : []))),
    [variants],
  );
  const currentSelection = value.filter((id) =>
    currentProductVariantIds.has(id),
  );

  function selectCurrentProduct(nextIds: string[]) {
    const retained = value.filter((id) => !currentProductVariantIds.has(id));
    onChange(Array.from(new Set([...retained, ...nextIds])));
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div>
        <Label htmlFor="discount-target-variants">{t("targetVariants")}</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("targetVariantsHint")}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {t("findProduct")}
          </span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t("searchProducts")}
            />
          </span>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {t("targetProduct")}
          </span>
          <Select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            <option value="">{t("chooseProduct")}</option>
            {(products.data?.items ?? [])
              .filter((item) => item.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </Select>
        </label>
      </div>
      {productId ? (
        product.isPending ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : product.isError ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-destructive">
            {t("variantsUnavailable")}
          </p>
        ) : variants.length ? (
          <MultiSelectList
            id="discount-target-variant-options"
            label={t("chooseVariants")}
            hint={t("targetVariantsHint")}
            options={variants
              .filter((variant) => variant.id)
              .map((variant) => ({
                value: variant.id!,
                label: variant.sku ?? variant.id!,
                description: String(variant.listPrice ?? 0),
              }))}
            value={currentSelection}
            onChange={selectCurrentProduct}
            selectedLabel={t("selectedCount", {count: currentSelection.length})}
            emptyLabel={t("noActiveVariants")}
          />
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {t("noActiveVariants")}
          </p>
        )
      ) : null}
      {value.length ? (
        <div className="flex flex-wrap gap-2" aria-label={t("selectedTargets")}>
          {value.map((id) => {
            const variant = product.data?.variants?.find(
              (candidate) => candidate.id === id,
            );
            return (
              <span
                key={id}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs"
              >
                <span className="truncate">{variant?.sku ?? id}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                  onClick={() => onChange(value.filter((item) => item !== id))}
                  aria-label={`${t("removeTarget")}: ${variant?.sku ?? id}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("noSelectedTargets")}</p>
      )}
    </div>
  );
}
