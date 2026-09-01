"use client";

import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";

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
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {AttributeDataType, ResourceStatus, type EditableResourceStatus} from "@/lib/domain/catalog-enums";
import type {
  UpdateAttributeDefinitionRequest,
  UpdateOptionRequest,
  CreateAttributeDefinitionRequest,
} from "@/features/admin/contracts/requests";
import type {
  AttributeDefinition,
  GroupSchemaItem,
  Option,
} from "@/features/admin/contracts/responses";
import type {CategoryTree} from "@/features/catalog/contracts/responses";

import { useCategories } from "@/features/catalog/queries";
import { ConfirmAction } from "./confirm-action";
import {
  useAttributes,
  useAssignAdminCategoryAttribute,
  useCategorySpecsSchema,
  useCreateAdminCategoryAttributeGroup,
  useCreateAdminAttribute,
  useCreateAdminOption,
  useDeleteAdminAttribute,
  useDeleteAdminCategoryAttribute,
  useDeleteAdminOption,
  useUpdateAdminCategoryAttributeGroup,
  useOptions,
  useUpdateAdminAttribute,
  useUpdateAdminOption,
} from "./queries";

type Attribute = AttributeDefinition;
type Mode = "options" | "attributes" | "category-schema";

export function CatalogSettingsPage() {
  const t = useTranslations("admin");
  const [mode, setMode] = useState<Mode>("options");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">{t("label")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("catalogSettingsTitle")}
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            {t("catalogSettingsDescription")}
          </p>
        </div>
        <div className="flex w-full rounded-xl border bg-card p-1 sm:w-auto">
          <TabButton
            active={mode === "options"}
            onClick={() => setMode("options")}
          >
            {t("skuOptions")}
          </TabButton>
          <TabButton
            active={mode === "attributes"}
            onClick={() => setMode("attributes")}
          >
            {t("attributeDefinitions")}
          </TabButton>
          <TabButton
            active={mode === "category-schema"}
            onClick={() => setMode("category-schema")}
          >
            {t("categorySchema")}
          </TabButton>
        </div>
      </header>

      {mode === "options" ? (
        <OptionsPanel />
      ) : mode === "attributes" ? (
        <AttributesPanel />
      ) : (
        <CategorySchemaPanel />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={
        "rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 " +
        (active
          ? "bg-slate-950 text-white shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground")
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function DisclosureHeader({
  title,
  description,
  open,
  onToggle,
}: {
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("admin");
  return (
    <CardHeader className="flex-row items-center justify-between gap-4">
      <div className="min-w-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onToggle}
        aria-expanded={open}
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

function OptionsPanel() {
  const t = useTranslations("admin");
  const query = useOptions();
  const create = useCreateAdminOption();
  const update = useUpdateAdminOption();
  const remove = useDeleteAdminOption();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("");
  const [editing, setEditing] = useState<Option | null>(null);
  const [form, setForm] = useState({ type: "", name: "", value: "" });

  const types = useMemo(
    () =>
      Array.from(
        new Set((query.data ?? []).map((item) => item.type).filter(Boolean)),
      ).sort(),
    [query.data],
  );
  const items = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return (query.data ?? []).filter((item) => {
      const matchesType = !type || item.type === type;
      const matchesKeyword =
        !needle ||
        [item.type, item.name, item.value]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle));
      return matchesType && matchesKeyword;
    });
  }, [keyword, query.data, type]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await create.mutateAsync({
      type: form.type.trim(),
      name: form.name.trim(),
      value: form.value.trim(),
    });
    setForm({ type: "", name: "", value: "" });
  }

  return (
    <div className="space-y-6">
      <Card>
        <DisclosureHeader
          title={t("createSkuOption")}
          description={t("createSkuOptionDescription")}
          open={open}
          onToggle={() => setOpen((value) => !value)}
        />
        {open ? (
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-3"
              onSubmit={(event) => void submit(event)}
            >
              <TextField
                id="new-option-type"
                label={t("optionType")}
                value={form.type}
                onChange={(value) =>
                  setForm((current) => ({ ...current, type: value }))
                }
                required
              />
              <TextField
                id="new-option-name"
                label={t("optionName")}
                value={form.name}
                onChange={(value) =>
                  setForm((current) => ({ ...current, name: value }))
                }
                required
              />
              <TextField
                id="new-option-value"
                label={t("optionValue")}
                value={form.value}
                onChange={(value) =>
                  setForm((current) => ({ ...current, value: value }))
                }
                required
              />
              <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
                <Button
                  type="submit"
                  disabled={
                    create.isPending ||
                    !form.type.trim() ||
                    !form.name.trim() ||
                    !form.value.trim()
                  }
                >
                  <Plus className="size-4" />
                  {t("create")}
                </Button>
                {create.isError ? <ErrorMessage error={create.error} /> : null}
              </div>
            </form>
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-5 text-primary" />
            {t("skuOptions")}
          </CardTitle>
          <CardDescription>{t("skuOptionsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <TextField
              id="option-search"
              label={t("searchOptions")}
              value={keyword}
              onChange={setKeyword}
            />
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-muted-foreground">
                {t("optionType")}
              </span>
              <Select
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="">{t("allOptionTypes")}</option>
                {types.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          {query.isPending ? (
            <Loading />
          ) : query.isError ? (
            <ErrorMessage error={query.error} />
          ) : items.length === 0 ? (
            <Empty title={t("noOptions")} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => (
                <OptionCard
                  key={item.id ?? index}
                  option={item}
                  onEdit={() => setEditing(item)}
                  onDelete={() =>
                    item.id ? remove.mutateAsync(item.id) : undefined
                  }
                />
              ))}
            </div>
          )}
          {remove.isError ? <ErrorMessage error={remove.error} /> : null}
        </CardContent>
      </Card>

      {editing ? (
        <OptionEditCard
          option={editing}
          onClose={() => setEditing(null)}
          onSave={(request) => update.mutateAsync({ id: editing.id!, request })}
          loading={update.isPending}
          error={update.error}
        />
      ) : null}
    </div>
  );
}

function OptionCard({
  option,
  onEdit,
  onDelete,
}: {
  option: Option;
  onEdit: () => void;
  onDelete: () => Promise<unknown> | unknown;
}) {
  const t = useTranslations("admin");
  return (
    <Card className="group transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <CardContent className="flex h-full flex-col justify-between gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {option.type ?? "—"}
            </p>
            <p className="mt-2 truncate text-lg font-semibold">
              {option.name ?? "—"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {option.value ?? "—"}
            </p>
          </div>
          <StatusBadge status={option.status} />
        </div>
        <div className="flex items-center justify-end gap-1 border-t pt-3 opacity-100 sm:opacity-70 sm:transition sm:group-hover:opacity-100">
          <Button type="button" size="sm" variant="ghost" onClick={onEdit}>
            <Pencil className="size-3.5" />
            {t("edit")}
          </Button>
          <ConfirmAction
            title={t("confirmDelete")}
            confirmLabel={t("delete")}
            cancelLabel={t("cancel")}
            onConfirm={onDelete}
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            ariaLabel={t("delete")}
          >
            <Trash2 className="size-4" />
          </ConfirmAction>
        </div>
      </CardContent>
    </Card>
  );
}

function OptionEditCard({
  option,
  onClose,
  onSave,
  loading,
  error,
}: {
  option: Option;
  onClose: () => void;
  onSave: (request: UpdateOptionRequest) => Promise<unknown>;
  loading: boolean;
  error: unknown;
}) {
  const t = useTranslations("admin");
  const [form, setForm] = useState({
    type: option.type ?? "",
    name: option.name ?? "",
    value: option.value ?? "",
    status: (option.status as EditableResourceStatus | undefined) ?? ResourceStatus.Active,
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSave({
      type: form.type.trim(),
      name: form.name.trim(),
      value: form.value.trim(),
      status: form.status,
    });
    onClose();
  }
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>{t("editSkuOption")}</CardTitle>
          <CardDescription className="mt-1">
            {t("editSkuOptionDescription")}
          </CardDescription>
        </div>
        <Button
          type="button"
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
          className="grid gap-4 sm:grid-cols-4"
          onSubmit={(event) => void submit(event)}
        >
          <TextField
            id="edit-option-type"
            label={t("optionType")}
            value={form.type}
            onChange={(value) =>
              setForm((current) => ({ ...current, type: value }))
            }
            required
          />
          <TextField
            id="edit-option-name"
            label={t("optionName")}
            value={form.name}
            onChange={(value) =>
              setForm((current) => ({ ...current, name: value }))
            }
            required
          />
          <TextField
            id="edit-option-value"
            label={t("optionValue")}
            value={form.value}
            onChange={(value) =>
              setForm((current) => ({ ...current, value: value }))
            }
            required
          />
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-muted-foreground">
              {t("status")}
            </span>
            <Select
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
          </label>
          <div className="flex gap-2 sm:col-span-4">
            <Button type="submit" disabled={loading}>
              {t("save")}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
          </div>
          {error ? (
            <div className="sm:col-span-4">
              <ErrorMessage error={error} />
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function AttributesPanel() {
  const t = useTranslations("admin");
  const query = useAttributes();
  const create = useCreateAdminAttribute();
  const update = useUpdateAdminAttribute();
  const remove = useDeleteAdminAttribute();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [editing, setEditing] = useState<Attribute | null>(null);
  const [form, setForm] = useState(attributeForm());
  const items = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return (query.data ?? []).filter(
      (item) =>
        !needle ||
        [item.key, item.displayName, item.dataType, item.unit]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle)),
    );
  }, [keyword, query.data]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    await create.mutateAsync(attributeRequest(form));
    setForm(attributeForm());
  }
  return (
    <div className="space-y-6">
      <Card>
        <DisclosureHeader
          title={t("createAttribute")}
          description={t("createAttributeDescription")}
          open={open}
          onToggle={() => setOpen((value) => !value)}
        />
        {open ? (
          <CardContent>
            <AttributeFields
              form={form}
              onChange={setForm}
              onSubmit={(event) => void submit(event)}
              submitLabel={t("create")}
              disabled={create.isPending}
              error={create.error}
            />
          </CardContent>
        ) : null}
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("attributeDefinitions")}</CardTitle>
          <CardDescription>
            {t("attributeDefinitionsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TextField
            id="attribute-search"
            label={t("searchAttributes")}
            value={keyword}
            onChange={setKeyword}
          />
          {query.isPending ? (
            <Loading />
          ) : query.isError ? (
            <ErrorMessage error={query.error} />
          ) : items.length === 0 ? (
            <Empty title={t("noAttributes")} />
          ) : (
            <div className="divide-y rounded-xl border">
              {items.map((item, index) => (
                <AttributeRow
                  key={item.id ?? index}
                  attribute={item}
                  onEdit={() => setEditing(item)}
                  onDelete={() =>
                    item.id ? remove.mutateAsync(item.id) : undefined
                  }
                />
              ))}
            </div>
          )}
          {remove.isError ? <ErrorMessage error={remove.error} /> : null}
        </CardContent>
      </Card>
      {editing ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{t("editAttribute")}</CardTitle>
              <CardDescription className="mt-1">
                {t("editAttributeDescription")}
              </CardDescription>
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => setEditing(null)}
              aria-label={t("close")}
            >
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <AttributeEditForm
              attribute={editing}
              onClose={() => setEditing(null)}
              onSave={(request) =>
                update.mutateAsync({ id: editing.id!, request })
              }
              loading={update.isPending}
              error={update.error}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

/**
 * A category's technical-specification schema is assembled from groups and
 * attribute assignments. Keeping this workflow beside option/attribute
 * definitions means an operator can configure a fresh catalog without
 * touching the database directly.
 */
function CategorySchemaPanel() {
  const t = useTranslations("admin");
  const categories = useCategories();
  const attributes = useAttributes();
  const createGroup = useCreateAdminCategoryAttributeGroup();
  const [categoryId, setCategoryId] = useState("");
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", displayOrder: "0" });
  const categoryItems = useMemo(
    () => flattenCategories(categories.data ?? []),
    [categories.data],
  );
  const selectedCategoryId = categoryId || categoryItems[0]?.id || "";
  const schema = useCategorySpecsSchema(selectedCategoryId);

  async function submitGroup(event: FormEvent) {
    event.preventDefault();
    if (!selectedCategoryId || !groupForm.name.trim()) return;
    await createGroup.mutateAsync({
      categoryId: selectedCategoryId,
      name: groupForm.name.trim(),
      displayOrder: Number(groupForm.displayOrder) || 0,
    });
    setGroupForm({ name: "", displayOrder: "0" });
    setGroupOpen(false);
  }

  const selectedCategory = categoryItems.find(
    (category) => category.id === selectedCategoryId,
  );
  const groups = schema.data?.groups ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("categorySchema")}</CardTitle>
          <CardDescription>{t("categorySchemaDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-muted-foreground">
                {t("categoryForSchema")}
              </span>
              <Select
                value={selectedCategoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                disabled={categories.isPending || categoryItems.length === 0}
              >
                {categoryItems.length === 0 ? (
                  <option value="">{t("noCategories")}</option>
                ) : null}
                {categoryItems.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGroupOpen((value) => !value)}
              disabled={!selectedCategoryId}
            >
              {groupOpen ? (
                <ChevronUp className="size-4" />
              ) : (
                <Plus className="size-4" />
              )}
              {groupOpen ? t("hideCreate") : t("createAttributeGroup")}
            </Button>
          </div>
          {selectedCategory ? (
            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {t("selectedCategory")}:
              </span>{" "}
              <span className="font-medium">{selectedCategory.label}</span>
            </div>
          ) : null}
          {groupOpen ? (
            <form
              className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end"
              onSubmit={(event) => void submitGroup(event)}
            >
              <div className="space-y-1.5 text-sm">
                <Label htmlFor="new-attribute-group-name">
                  {t("groupName")}
                </Label>
                <Input
                  id="new-attribute-group-name"
                  value={groupForm.name}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5 text-sm">
                <Label htmlFor="new-attribute-group-order">
                  {t("displayOrder")}
                </Label>
                <Input
                  id="new-attribute-group-order"
                  type="number"
                  min="0"
                  value={groupForm.displayOrder}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      displayOrder: event.target.value,
                    }))
                  }
                />
              </div>
              <Button
                type="submit"
                disabled={createGroup.isPending || !groupForm.name.trim()}
              >
                <Plus className="size-4" />
                {t("create")}
              </Button>
              {createGroup.isError ? (
                <div className="sm:col-span-3">
                  <ErrorMessage error={createGroup.error} />
                </div>
              ) : null}
            </form>
          ) : null}
          {categories.isPending || schema.isPending ? (
            <Loading />
          ) : categories.isError ? (
            <ErrorMessage error={categories.error} />
          ) : schema.isError ? (
            <ErrorMessage error={schema.error} />
          ) : groups.length === 0 ? (
            <Empty title={t("noAttributeGroups")} />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {groups.map((group, index) => (
                <CategoryGroupCard
                  key={group.groupId ?? index}
                  group={group}
                  attributes={attributes.data ?? []}
                />
              ))}
            </div>
          )}
          {attributes.isError ? <ErrorMessage error={attributes.error} /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryGroupCard({
  group,
  attributes,
}: {
  group: GroupSchemaItem;
  attributes: AttributeDefinition[];
}) {
  const t = useTranslations("admin");
  const update = useUpdateAdminCategoryAttributeGroup();
  const assign = useAssignAdminCategoryAttribute();
  const remove = useDeleteAdminCategoryAttribute();
  const [editing, setEditing] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: group.groupName ?? "",
    displayOrder: String(group.displayOrder ?? 0),
  });
  const [attributeId, setAttributeId] = useState("");
  const [required, setRequired] = useState(false);
  const [displayOrder, setDisplayOrder] = useState("0");
  const assigned = group.attributes ?? [];
  const assignedIds = new Set(
    assigned.map((attribute) => attribute.attributeId).filter(Boolean),
  );
  const availableAttributes = attributes.filter(
    (attribute) =>
      attribute.id &&
      attribute.status === ResourceStatus.Active &&
      !assignedIds.has(attribute.id),
  );

  async function saveGroup(event: FormEvent) {
    event.preventDefault();
    if (!group.groupId || !groupForm.name.trim()) return;
    await update.mutateAsync({
      id: group.groupId,
      request: {
        name: groupForm.name.trim(),
        displayOrder: Number(groupForm.displayOrder) || 0,
      },
    });
    setEditing(false);
  }

  async function addAttribute(event: FormEvent) {
    event.preventDefault();
    if (!group.groupId || !attributeId) return;
    await assign.mutateAsync({
      categoryGroupId: group.groupId,
      attributeId,
      required,
      displayOrder: Number(displayOrder) || 0,
    });
    setAttributeId("");
    setRequired(false);
    setDisplayOrder("0");
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">
              {group.groupName ?? t("groupName")}
            </CardTitle>
            <CardDescription className="mt-1">
              {assigned.length} {t("assignedAttributesCount")}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditing((value) => !value)}
            aria-label={editing ? t("close") : t("edit")}
          >
            {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {editing ? (
          <form
            className="grid gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end"
            onSubmit={(event) => void saveGroup(event)}
          >
            <div className="space-y-1.5 text-sm">
              <Label htmlFor={`group-name-${group.groupId}`}>
                {t("groupName")}
              </Label>
              <Input
                id={`group-name-${group.groupId}`}
                value={groupForm.name}
                onChange={(event) =>
                  setGroupForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-1.5 text-sm">
              <Label htmlFor={`group-order-${group.groupId}`}>
                {t("displayOrder")}
              </Label>
              <Input
                id={`group-order-${group.groupId}`}
                type="number"
                min="0"
                value={groupForm.displayOrder}
                onChange={(event) =>
                  setGroupForm((current) => ({
                    ...current,
                    displayOrder: event.target.value,
                  }))
                }
              />
            </div>
            <Button type="submit" size="sm" disabled={update.isPending}>
              <Save className="size-3.5" />
              {t("save")}
            </Button>
            {update.isError ? (
              <div className="sm:col-span-3">
                <ErrorMessage error={update.error} />
              </div>
            ) : null}
          </form>
        ) : null}

        {assigned.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            {t("noAssignedAttributes")}
          </p>
        ) : (
          <div className="space-y-2">
            {assigned.map((attribute, index) => (
              <div
                key={attribute.assignmentId ?? attribute.attributeId ?? index}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {attribute.displayName ?? attribute.key ?? "—"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {attribute.key ?? "—"}
                    {attribute.required ? ` · ${t("requiredAttribute")}` : ""}
                    {attribute.unit ? ` · ${attribute.unit}` : ""}
                  </p>
                </div>
                {attribute.assignmentId ? (
                  <ConfirmAction
                    title={t("removeAssignment")}
                    confirmLabel={t("delete")}
                    cancelLabel={t("cancel")}
                    onConfirm={() => remove.mutateAsync(attribute.assignmentId!)}
                    size="icon-sm"
                    variant="ghost"
                    className="shrink-0 text-destructive hover:text-destructive"
                    ariaLabel={t("removeAssignment")}
                  >
                    <Trash2 className="size-4" />
                  </ConfirmAction>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <form
          className="grid gap-3 border-t pt-4 sm:grid-cols-[minmax(0,1fr)_8rem_auto_auto] sm:items-end"
          onSubmit={(event) => void addAttribute(event)}
        >
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-muted-foreground">
              {t("selectAttribute")}
            </span>
            <Select
              value={attributeId}
              onChange={(event) => setAttributeId(event.target.value)}
              disabled={availableAttributes.length === 0}
            >
              <option value="">
                {availableAttributes.length === 0
                  ? t("allAttributesAssigned")
                  : t("chooseAttribute")}
              </option>
              {availableAttributes.map((attribute) => (
                <option key={attribute.id} value={attribute.id}>
                  {attribute.displayName ?? attribute.key}
                </option>
              ))}
            </Select>
          </label>
          <div className="space-y-1.5 text-sm">
            <Label htmlFor={`attribute-order-${group.groupId}`}>
              {t("displayOrder")}
            </Label>
            <Input
              id={`attribute-order-${group.groupId}`}
              type="number"
              min="0"
              value={displayOrder}
              onChange={(event) => setDisplayOrder(event.target.value)}
            />
          </div>
          <label className="flex h-10 items-center gap-2 whitespace-nowrap text-sm">
            <input
              type="checkbox"
              checked={required}
              onChange={(event) => setRequired(event.target.checked)}
            />
            {t("requiredAttribute")}
          </label>
          <Button
            type="submit"
            size="sm"
            disabled={assign.isPending || !attributeId}
          >
            <Plus className="size-4" />
            {t("assignAttribute")}
          </Button>
          {assign.isError || remove.isError ? (
            <div className="sm:col-span-4">
              <ErrorMessage error={assign.error ?? remove.error} />
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function AttributeRow({
  attribute,
  onEdit,
  onDelete,
}: {
  attribute: Attribute;
  onEdit: () => void;
  onDelete: () => Promise<unknown> | unknown;
}) {
  const t = useTranslations("admin");
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded bg-muted px-2 py-1 text-xs">
            {attribute.key ?? "—"}
          </code>
          <span className="font-medium">{attribute.displayName ?? "—"}</span>
          <StatusBadge status={attribute.status} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {attribute.dataType ?? "—"}
          {attribute.unit ? ` · ${attribute.unit}` : ""}
          {attribute.filterable ? ` · ${t("filterable")}` : ""}
          {attribute.comparable ? ` · ${t("comparable")}` : ""}
        </p>
        {attribute.allowedValues?.length ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {t("allowedValues")}: {attribute.allowedValues.join(", ")}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button type="button" size="sm" variant="ghost" onClick={onEdit}>
          <Pencil className="size-3.5" />
          {t("edit")}
        </Button>
        <ConfirmAction
          title={t("confirmDelete")}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          onConfirm={onDelete}
          size="icon-sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          ariaLabel={t("delete")}
        >
          <Trash2 className="size-4" />
        </ConfirmAction>
      </div>
    </div>
  );
}

type AttributeFormValue = {
  key: string;
  displayName: string;
  dataType: AttributeDataType;
  unit: string;
  allowedValues: string;
  aliases: string;
  filterable: boolean;
  comparable: boolean;
  status: EditableResourceStatus;
};

function attributeForm(attribute?: Attribute): AttributeFormValue {
  return {
    key: attribute?.key ?? "",
    displayName: attribute?.displayName ?? "",
    dataType: (attribute?.dataType as AttributeDataType | undefined) ?? AttributeDataType.String,
    unit: attribute?.unit ?? "",
    allowedValues: attribute?.allowedValues?.join(", ") ?? "",
    aliases: attribute?.aliases?.join(", ") ?? "",
    filterable: Boolean(attribute?.filterable),
    comparable: Boolean(attribute?.comparable),
    status: (attribute?.status as EditableResourceStatus | undefined) ?? ResourceStatus.Active,
  };
}
function attributeRequest(
  form: AttributeFormValue,
): CreateAttributeDefinitionRequest {
  return {
    key: form.key.trim(),
    displayName: form.displayName.trim(),
    dataType: form.dataType,
    unit: form.unit.trim() || undefined,
    allowedValues: splitValues(form.allowedValues),
    aliases: splitValues(form.aliases),
    filterable: form.filterable,
    comparable: form.comparable,
  };
}
function attributeUpdateRequest(
  form: AttributeFormValue,
): UpdateAttributeDefinitionRequest {
  return {
    displayName: form.displayName.trim(),
    dataType: form.dataType,
    unit: form.unit.trim() || undefined,
    allowedValues: splitValues(form.allowedValues),
    aliases: splitValues(form.aliases),
    filterable: form.filterable,
    comparable: form.comparable,
    status: form.status,
  };
}
function splitValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function AttributeFields({
  form,
  onChange,
  onSubmit,
  submitLabel,
  disabled,
  error,
  keyReadOnly = false,
}: {
  form: AttributeFormValue;
  onChange: Dispatch<SetStateAction<AttributeFormValue>>;
  onSubmit: (event: FormEvent) => void;
  submitLabel: string;
  disabled: boolean;
  error: unknown;
  keyReadOnly?: boolean;
}) {
  const t = useTranslations("admin");
  return (
    <form
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={onSubmit}
    >
      <TextField
        id="attribute-key"
        label={t("attributeKey")}
        value={form.key}
        onChange={(value) =>
          onChange((current) => ({ ...current, key: value }))
        }
        required
        readOnly={keyReadOnly}
      />
      <TextField
        id="attribute-display"
        label={t("attributeDisplayName")}
        value={form.displayName}
        onChange={(value) =>
          onChange((current) => ({ ...current, displayName: value }))
        }
        required
      />
      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-muted-foreground">
          {t("dataType")}
        </span>
        <Select
          value={form.dataType}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              dataType: event.target.value as AttributeDataType,
            }))
          }
        >
          <option value={AttributeDataType.String}>{AttributeDataType.String}</option>
          <option value={AttributeDataType.Number}>{AttributeDataType.Number}</option>
          <option value={AttributeDataType.Enum}>{AttributeDataType.Enum}</option>
          <option value={AttributeDataType.Boolean}>{AttributeDataType.Boolean}</option>
        </Select>
      </label>
      <TextField
        id="attribute-unit"
        label={t("unit")}
        value={form.unit}
        onChange={(value) =>
          onChange((current) => ({ ...current, unit: value }))
        }
      />
      <TextField
        id="attribute-values"
        label={t("allowedValues")}
        value={form.allowedValues}
        onChange={(value) =>
          onChange((current) => ({ ...current, allowedValues: value }))
        }
      />
      <TextField
        id="attribute-aliases"
        label={t("aliases")}
        value={form.aliases}
        onChange={(value) =>
          onChange((current) => ({ ...current, aliases: value }))
        }
      />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-2">
        <CheckField
          label={t("filterable")}
          checked={form.filterable}
          onChange={(checked) =>
            onChange((current) => ({ ...current, filterable: checked }))
          }
        />
        <CheckField
          label={t("comparable")}
          checked={form.comparable}
          onChange={(checked) =>
            onChange((current) => ({ ...current, comparable: checked }))
          }
        />
      </div>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
        <Button
          type="submit"
          disabled={disabled || !form.key.trim() || !form.displayName.trim()}
        >
          <Plus className="size-4" />
          {submitLabel}
        </Button>
        {error ? <ErrorMessage error={error} /> : null}
      </div>
    </form>
  );
}

function AttributeEditForm({
  attribute,
  onClose,
  onSave,
  loading,
  error,
}: {
  attribute: Attribute;
  onClose: () => void;
  onSave: (
    request: UpdateAttributeDefinitionRequest,
  ) => Promise<unknown>;
  loading: boolean;
  error: unknown;
}) {
  const t = useTranslations("admin");
  const [form, setForm] = useState(attributeForm(attribute));
  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSave(attributeUpdateRequest(form));
    onClose();
  }
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-3 text-sm">
        <span className="text-muted-foreground">{t("attributeKey")}: </span>
        <code>{attribute.key}</code>
      </div>
      <AttributeFields
        form={form}
        onChange={setForm}
        onSubmit={(event) => void submit(event)}
        submitLabel={t("save")}
        disabled={loading}
        error={error}
        keyReadOnly
      />
      <div className="flex items-center gap-3">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {t("status")}
          </span>
          <Select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value as EditableResourceStatus }))
            }
          >
            <option value={ResourceStatus.Active}>{t("statusValues.ACTIVE")}</option>
            <option value={ResourceStatus.Inactive}>{t("statusValues.INACTIVE")}</option>
          </Select>
        </label>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={onClose}
        >
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  required = false,
  readOnly = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5 text-sm">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className={readOnly ? "bg-muted/50 text-muted-foreground" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        readOnly={readOnly}
      />
    </div>
  );
}
function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
function Loading() {
  return <Skeleton className="h-40 rounded-2xl" />;
}
function Empty({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
      {title}
    </div>
  );
}

function flattenCategories(
  categories: CategoryTree[],
  depth = 0,
): { id: string; label: string }[] {
  return categories.flatMap((category) => [
    ...(category.id && category.status !== ResourceStatus.Deleted
      ? [
          {
            id: category.id,
            label: `${"— ".repeat(depth)}${category.name ?? ""}`,
          },
        ]
      : []),
    ...flattenCategories(category.children ?? [], depth + 1),
  ]);
}
