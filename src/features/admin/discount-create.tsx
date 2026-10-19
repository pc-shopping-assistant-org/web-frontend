"use client";

import {useTranslations} from "next-intl";
import {useState, type FormEvent, type ReactNode} from "react";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {MultiSelectList} from "@/components/ui/multi-select-list";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {useCategories} from "@/features/catalog/queries";
import type {DiscountDetail} from "@/features/admin/contracts/responses";
import {useRouter} from "@/i18n/navigation";
import {DiscountScope, DiscountStatus, DiscountType} from "@/lib/domain/commerce-enums";

import {flattenCategories} from "./list-helpers";
import {ConfirmAction} from "./confirm-action";
import {StatusSelect} from "./status-select";
import {useAdminDiscountStatus, useCreateAdminDiscount, useDeleteAdminDiscount, useUpdateAdminDiscount} from "./queries";
import {MoneyInput} from "./variant-matrix";

const MAX_NAME = 255;
const MAX_CODE = 50;
const MAX_PERCENT = 100;
const DEFAULT_DURATION_DAYS = 7;
const MS_PER_DAY = 86_400_000;

/** The value a datetime-local input wants: the local clock, to the minute. */
function toLocalInput(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function initialForm(discount?: DiscountDetail) {
  if (discount) {
    return {
      title: discount.title ?? "",
      code: discount.code ?? "",
      description: discount.description ?? "",
      startAt: discount.startAt ? toLocalInput(new Date(discount.startAt)) : "",
      endAt: discount.endAt ? toLocalInput(new Date(discount.endAt)) : "",
      discountType: (discount.discountType as DiscountType | undefined) ?? DiscountType.Percent,
      value: discount.value ? String(discount.value) : "",
      minOrderAmount: discount.minOrderAmount ? String(discount.minOrderAmount) : "",
      applicationScope: (discount.applicationScope as DiscountScope | undefined) ?? DiscountScope.Order,
      categoryIds: discount.categoryIds ?? [],
    };
  }
  const now = new Date();
  return {
    title: "",
    code: "",
    description: "",
    startAt: toLocalInput(now),
    endAt: toLocalInput(new Date(now.getTime() + DEFAULT_DURATION_DAYS * MS_PER_DAY)),
    discountType: DiscountType.Percent as DiscountType,
    value: "",
    minOrderAmount: "",
    applicationScope: DiscountScope.Order as DiscountScope,
    categoryIds: [] as string[],
  };
}

/** A label on the left and the control on the right, as in the Shopee seller centre; stacked on a narrow screen. */
function FormRow({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-x-6">
      <Label htmlFor={htmlFor} className="sm:pt-2.5 sm:text-right">
        {required ? <span className="mr-0.5 text-destructive">*</span> : null}
        {label}
      </Label>
      <div className="min-w-0 space-y-1.5">
        {children}
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

function Section({title, children}: {title: string; children: ReactNode}) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-6 space-y-6">{children}</div>
    </Card>
  );
}

/** An input with its length counter on the right ("12/255"). */
function CountedInput({
  id,
  value,
  max,
  onChange,
  placeholder,
  upper,
  disabled,
}: {
  id: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
  placeholder?: string;
  upper?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        maxLength={max}
        disabled={disabled}
        placeholder={placeholder}
        className={upper ? "pr-16 uppercase placeholder:normal-case" : "pr-16"}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" aria-hidden="true">
        {value.length}/{max}
      </span>
    </div>
  );
}

export function DiscountCreateForm() {
  return <DiscountForm />;
}

/** One form for a new promotion and for the edit of one: with `discount` it saves over it and offers lock and delete. */
export function DiscountForm({discount}: {discount?: DiscountDetail}) {
  const t = useTranslations("admin");
  const td = useTranslations("admin.discountCreate");
  const router = useRouter();
  const categories = useCategories();
  const create = useCreateAdminDiscount();
  const update = useUpdateAdminDiscount();
  const remove = useDeleteAdminDiscount();
  const status = useAdminDiscountStatus();
  const mutation = discount ? update : create;
  const [form, setForm] = useState(() => initialForm(discount));
  const [problem, setProblem] = useState<string | null>(null);
  const set = (patch: Partial<typeof form>) => setForm((current) => ({...current, ...patch}));
  const isOrder = form.applicationScope === DiscountScope.Order;
  const percent = form.discountType === DiscountType.Percent;

  function validate(): string | null {
    const value = Number(form.value);
    if (!form.title.trim()) return td("problem.name");
    if (!Number.isInteger(value) || value <= 0 || (percent && value > MAX_PERCENT))
      return td(percent ? "problem.percent" : "problem.amount");
    if (!form.startAt || !form.endAt || new Date(form.endAt) <= new Date(form.startAt)) return td("problem.period");
    if (form.applicationScope === DiscountScope.Category && form.categoryIds.length === 0) return td("problem.categories");
    return null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setProblem(found);
    if (found) return;
    const request = {
      title: form.title.trim(),
      code: isOrder ? form.code.trim() || undefined : undefined,
      discountType: form.discountType,
      value: Number(form.value),
      applicationScope: form.applicationScope,
      minOrderAmount: Number(form.minOrderAmount || 0),
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      description: form.description.trim() || undefined,
      categoryIds: form.applicationScope === DiscountScope.Category ? form.categoryIds : [],
    };
    try {
      if (discount?.id) await update.mutateAsync({id: discount.id, request});
      else await create.mutateAsync(request);
    } catch {
      return;
    }
    router.push("/admin/discounts");
  }

  const scopes = [
    {value: DiscountScope.Order, title: td("scope.order"), description: td("scope.orderHint")},
    {value: DiscountScope.AllItems, title: td("scope.allItems"), description: td("scope.allItemsHint")},
    {value: DiscountScope.Category, title: td("scope.category"), description: td("scope.categoryHint")},
  ];

  return (
    <form className="space-y-5" noValidate onSubmit={(event) => void submit(event)}>
      <Section title={td("basicTitle")}>
        <FormRow label={td("name")} htmlFor="discount-name" required hint={td("nameHint")}>
          <CountedInput id="discount-name" value={form.title} max={MAX_NAME} onChange={(title) => set({title})} />
        </FormRow>
        <FormRow label={td("code")} htmlFor="discount-code" hint={isOrder ? td("codeHint") : td("codeLocked")}>
          <CountedInput
            id="discount-code"
            value={isOrder ? form.code : ""}
            max={MAX_CODE}
            upper
            disabled={!isOrder}
            placeholder={td("codePlaceholder")}
            onChange={(code) => set({code: code.toUpperCase().replace(/[^A-Z0-9]/g, "")})}
          />
        </FormRow>
        <FormRow label={td("period")} htmlFor="discount-start" required>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              id="discount-start"
              type="datetime-local"
              className="w-full sm:w-56"
              value={form.startAt}
              onChange={(event) => set({startAt: event.target.value})}
            />
            <span className="hidden text-muted-foreground sm:inline" aria-hidden="true">
              —
            </span>
            <Input
              id="discount-end"
              type="datetime-local"
              aria-label={t("endAt")}
              className="w-full sm:w-56"
              value={form.endAt}
              onChange={(event) => set({endAt: event.target.value})}
            />
          </div>
        </FormRow>
        <FormRow label={t("description")} htmlFor="discount-description">
          <Textarea id="discount-description" value={form.description} onChange={(event) => set({description: event.target.value})} />
        </FormRow>
      </Section>

      <Section title={td("settingsTitle")}>
        <FormRow
          label={td("valueLabel")}
          htmlFor="discount-value"
          required
          hint={percent ? td("percentHint") : td(isOrder ? "amountHintOrder" : "amountHintItem")}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              aria-label={t("discountType")}
              className="sm:w-48"
              value={form.discountType}
              onChange={(event) => set({discountType: event.target.value as DiscountType, value: ""})}
            >
              <option value={DiscountType.Percent}>{t("discountTypeValues.PERCENT")}</option>
              <option value={DiscountType.Fixed}>{t("discountTypeValues.FIXED")}</option>
            </Select>
            <div className="min-w-0 flex-1">
              {percent ? (
                <div className="relative">
                  <Input
                    id="discount-value"
                    type="number"
                    min="1"
                    max={MAX_PERCENT}
                    step="1"
                    inputMode="numeric"
                    className="pr-10"
                    value={form.value}
                    onChange={(event) => set({value: event.target.value})}
                  />
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                    aria-hidden="true"
                  >
                    %
                  </span>
                </div>
              ) : (
                <MoneyInput id="discount-value" value={form.value} onChange={(value) => set({value})} />
              )}
            </div>
          </div>
        </FormRow>
        <FormRow label={td(isOrder ? "minOrder" : "minLine")} htmlFor="discount-min" hint={td("minHint")}>
          <MoneyInput id="discount-min" value={form.minOrderAmount} onChange={(minOrderAmount) => set({minOrderAmount})} />
        </FormRow>
      </Section>

      <Section title={td("scopeTitle")}>
        <FormRow label={t("applicationScope")}>
          <div role="radiogroup" aria-label={t("applicationScope")} className="space-y-3">
            {scopes.map((scope) => (
              <label key={scope.value} className="flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="discount-scope"
                  className="mt-1 size-4 accent-primary"
                  checked={form.applicationScope === scope.value}
                  onChange={() => set({applicationScope: scope.value, code: scope.value === DiscountScope.Order ? form.code : ""})}
                />
                <span>
                  <span className="block text-sm font-medium">{scope.title}</span>
                  <span className="block text-xs text-muted-foreground">{scope.description}</span>
                </span>
              </label>
            ))}
          </div>
        </FormRow>
        {form.applicationScope === DiscountScope.Category ? (
          <FormRow label={td("categories")} required>
            <MultiSelectList
              id="discount-categories"
              label={td("categories")}
              hint={t("targetCategoriesHint")}
              options={flattenCategories(categories.data ?? []).map((category) => ({value: category.id, label: category.label}))}
              value={form.categoryIds}
              onChange={(categoryIds) => set({categoryIds})}
              selectedLabel={t("selectedCount", {count: form.categoryIds.length})}
              emptyLabel={t("noCategories")}
              className="[&_legend]:sr-only"
            />
          </FormRow>
        ) : null}
      </Section>

      {problem || mutation.isError || status.isError || remove.isError ? (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {problem ?? <ErrorMessage error={mutation.error ?? status.error ?? remove.error} />}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {discount?.id ? (
            <>
              <StatusSelect
                currentStatus={discount.status ?? DiscountStatus.Active}
                options={[DiscountStatus.Active, DiscountStatus.Inactive]}
                label={t("status")}
                onStatus={(next) => status.mutateAsync({id: discount.id!, status: next})}
                className="h-10 w-40"
                disabled={status.isPending}
              />
              <ConfirmAction
                title={t("confirmDelete")}
                confirmLabel={t("delete")}
                cancelLabel={t("cancel")}
                onConfirm={() => remove.mutateAsync(discount.id!).then(() => router.push("/admin/discounts"))}
                size="lg"
                variant="outline"
                className="text-destructive hover:text-destructive"
              >
                {t("delete")}
              </ConfirmAction>
            </>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="lg" disabled={mutation.isPending} onClick={() => router.push("/admin/discounts")}>
            {t("cancel")}
          </Button>
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {discount ? t("save") : td("submit")}
          </Button>
        </div>
      </div>
    </form>
  );
}
