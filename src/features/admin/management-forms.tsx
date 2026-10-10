"use client";

import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import type {CategoryTree} from "@/features/catalog/contracts/responses";
import {DiscountScope, DiscountType} from "@/lib/domain/commerce-enums";

import { useCategories } from "@/features/catalog/queries";
import {
  useCreateAdminDiscount,
  useCreateAdminSupplier,
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
  });
  function set(key: keyof typeof form, value: string | string[]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
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
      categoryIds:
      form.applicationScope === DiscountScope.Category ? form.categoryIds : [],
    });
    } catch {
      return;
    }
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
    });
  }
  const targetError =
    form.applicationScope === DiscountScope.Category && form.categoryIds.length === 0;
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
