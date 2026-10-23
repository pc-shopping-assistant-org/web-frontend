"use client";

import {ChevronDown, ChevronUp, Plus, Search, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {useId, useMemo, useState, type FormEvent} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {ConfirmAction} from "@/components/ui/confirm-action";
import {Dialog} from "@/components/ui/dialog";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import {Skeleton} from "@/components/ui/skeleton";
import {Textarea} from "@/components/ui/textarea";
import type {AttributeDefinition, AttributeSchemaItem} from "@/features/admin/contracts/responses";
import {useCategories} from "@/features/catalog/queries";
import type {CategoryTree} from "@/features/catalog/contracts/responses";
import {ATTRIBUTE_DATA_TYPE_VALUES, AttributeDataType} from "@/lib/domain/catalog-enums";
import {cn} from "@/lib/utils";

import {
  useAttributes,
  useCategorySpecsSchema,
  useCreateAdminAttribute,
  useDeleteAdminAttribute,
  useReplaceAdminCategorySpecs,
  useUpdateAdminAttribute,
} from "./queries";

type Mode = "attributes" | "specs";

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const MAX_CHIPS = 4;

/** The tint of a data type's badge: the type is the first thing to read in a row of attributes. */
const TYPE_TONE: Record<string, string> = {
  [AttributeDataType.Number]: "border-sky-200 bg-sky-50 text-sky-700",
  [AttributeDataType.String]: "border-slate-200 bg-slate-50 text-slate-700",
  [AttributeDataType.Enum]: "border-violet-200 bg-violet-50 text-violet-700",
  [AttributeDataType.Boolean]: "border-emerald-200 bg-emerald-50 text-emerald-700",
  [AttributeDataType.List]: "border-amber-200 bg-amber-50 text-amber-700",
};

/**
 * What a shop sets up before it lists products: the technical attributes it knows (RAM size, socket, …) and,
 * per category, the form of specifications a product in it fills in.
 */
export function CatalogSettingsPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("admin.catalogConfig");
  const [mode, setMode] = useState<Mode>("attributes");
  const tabs: {value: Mode; label: string}[] = [
    {value: "attributes", label: tc("tabAttributes")},
    {value: "specs", label: tc("tabSpecs")},
  ];

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("catalogSettingsTitle")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t("catalogSettingsDescription")}</p>
      </div>

      <div role="tablist" aria-label={t("catalogSettingsTitle")} className="flex gap-6 overflow-x-auto overflow-y-hidden border-b">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={mode === tab.value}
            onClick={() => setMode(tab.value)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-1 pb-3 text-sm transition",
              mode === tab.value
                ? "border-primary font-medium text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "attributes" ? <AttributesPanel /> : <SpecsPanel onGoAttributes={() => setMode("attributes")} />}
    </section>
  );
}

/* ------------------------------------------------------------------ attributes */

type AttributeDialogState = {mode: "create"} | {mode: "edit"; attribute: AttributeDefinition};

function AttributesPanel() {
  const t = useTranslations("admin");
  const tc = useTranslations("admin.catalogConfig");
  const attributes = useAttributes();
  const remove = useDeleteAdminAttribute();
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("");
  const [dialog, setDialog] = useState<AttributeDialogState | null>(null);
  const all = attributes.data ?? [];
  const needle = keyword.trim().toLowerCase();
  const rows = all.filter(
    (attribute) =>
      (!type || attribute.dataType === type) &&
      (!needle || attribute.displayName.toLowerCase().includes(needle) || attribute.key.toLowerCase().includes(needle)),
  );

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={tc("searchPlaceholder")}
            aria-label={tc("searchPlaceholder")}
          />
        </div>
        <Select className="w-full sm:w-48" aria-label={tc("type")} value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">{tc("allTypes")}</option>
          {ATTRIBUTE_DATA_TYPE_VALUES.map((value) => (
            <option key={value} value={value}>
              {tc(`dataTypes.${value}`)}
            </option>
          ))}
        </Select>
        <Button type="button" size="lg" onClick={() => setDialog({mode: "create"})}>
          <Plus className="size-4" />
          {tc("add")}
        </Button>
      </div>

      <div className="mt-4">
        {attributes.isPending ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : attributes.isError ? (
          <ErrorMessage error={attributes.error} />
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            {all.length === 0 ? tc("empty") : tc("emptyFiltered")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {tc("attribute")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {tc("type")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {tc("values")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {tc("usage")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {tc("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((attribute) => (
                  <tr key={attribute.id} className="border-t align-top transition hover:bg-muted/20">
                    <td className="max-w-xs px-4 py-3">
                      <p className="font-medium">{attribute.displayName}</p>
                      <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                        {attribute.key}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className={TYPE_TONE[attribute.dataType ?? ""] ?? TYPE_TONE[AttributeDataType.String]}>
                          {attribute.dataType ? tc(`dataTypes.${attribute.dataType}`) : "—"}
                        </Badge>
                        {attribute.unit ? <span className="text-xs text-muted-foreground">{attribute.unit}</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ValueChips values={attribute.allowedValues} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {attribute.filterable ? (
                          <Badge className="border-primary/30 bg-primary/5 text-primary">{tc("filterable")}</Badge>
                        ) : null}
                        {attribute.comparable ? (
                          <Badge className="border-primary/30 bg-primary/5 text-primary">{tc("comparable")}</Badge>
                        ) : null}
                        {!attribute.filterable && !attribute.comparable ? <span className="text-muted-foreground">—</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <Button
                          type="button"
                          variant="link"
                          size="xs"
                          className="h-auto p-0 text-sm font-medium"
                          onClick={() => setDialog({mode: "edit", attribute})}
                        >
                          {tc("edit")}
                        </Button>
                        <ConfirmAction
                          title={tc("deleteTitle")}
                          description={tc("deleteDescription")}
                          confirmLabel={t("delete")}
                          cancelLabel={t("cancel")}
                          onConfirm={() => remove.mutateAsync(attribute.id)}
                          variant="link"
                          size="xs"
                          className="h-auto p-0 text-sm font-medium text-destructive"
                        >
                          {t("delete")}
                        </ConfirmAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {attributes.data && rows.length > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">{tc("count", {count: rows.length})}</p>
        ) : null}
      </div>

      {dialog ? (
        <AttributeDialog key={dialog.mode === "edit" ? dialog.attribute.id : "new"} state={dialog} onClose={() => setDialog(null)} />
      ) : null}
    </Card>
  );
}

function ValueChips({values}: {values: string[]}) {
  const tc = useTranslations("admin.catalogConfig");
  if (values.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex max-w-sm flex-wrap gap-1.5">
      {values.slice(0, MAX_CHIPS).map((value) => (
        <span key={value} className="rounded-md bg-muted px-2 py-0.5 text-xs">
          {value}
        </span>
      ))}
      {values.length > MAX_CHIPS ? (
        <span className="px-1 py-0.5 text-xs text-muted-foreground">{tc("more", {count: values.length - MAX_CHIPS})}</span>
      ) : null}
    </div>
  );
}

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function AttributeDialog({state, onClose}: {state: AttributeDialogState; onClose: () => void}) {
  const t = useTranslations("admin");
  const tc = useTranslations("admin.catalogConfig");
  const formId = useId();
  const create = useCreateAdminAttribute();
  const update = useUpdateAdminAttribute();
  const editing = state.mode === "edit" ? state.attribute : null;
  const mutation = editing ? update : create;
  const [form, setForm] = useState({
    displayName: editing?.displayName ?? "",
    key: editing?.key ?? "",
    dataType: (editing?.dataType as AttributeDataType | undefined) ?? AttributeDataType.String,
    unit: editing?.unit ?? "",
    allowedValues: (editing?.allowedValues ?? []).join("\n"),
    aliases: (editing?.aliases ?? []).join(", "),
    filterable: editing?.filterable ?? false,
    comparable: editing?.comparable ?? false,
  });
  const [problem, setProblem] = useState<string | null>(null);
  const set = (patch: Partial<typeof form>) => setForm((current) => ({...current, ...patch}));
  const isEnum = form.dataType === AttributeDataType.Enum;
  const hasAllowedValues = isEnum || form.dataType === AttributeDataType.List;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const allowedValues = hasAllowedValues ? lines(form.allowedValues) : [];
    if (!editing && !KEY_PATTERN.test(form.key.trim())) return setProblem(tc("keyInvalid"));
    if (isEnum && allowedValues.length === 0) return setProblem(tc("allowedRequired"));
    setProblem(null);
    const body = {
      displayName: form.displayName.trim(),
      unit: form.unit.trim() || undefined,
      allowedValues,
      aliases: form.aliases
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      filterable: form.filterable,
      comparable: form.comparable,
    };
    try {
      if (editing) await update.mutateAsync({id: editing.id, request: body});
      else await create.mutateAsync({...body, key: form.key.trim(), dataType: form.dataType});
    } catch {
      return;
    }
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      busy={mutation.isPending}
      closeLabel={t("close")}
      title={editing ? tc("editTitle") : tc("addTitle")}
      description={editing ? undefined : tc("addDescription")}
      footer={
        <>
          <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" form={formId} disabled={mutation.isPending || !form.displayName.trim() || (!editing && !form.key.trim())}>
            {editing ? t("save") : tc("create")}
          </Button>
        </>
      }
    >
      <form id={formId} className="grid grid-cols-[minmax(0,1fr)] gap-4" noValidate onSubmit={(event) => void submit(event)}>
        <div className="space-y-2">
          <Label htmlFor={`${formId}-name`}>
            {tc("displayName")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${formId}-name`}
            data-autofocus
            value={form.displayName}
            maxLength={255}
            onChange={(event) => set({displayName: event.target.value})}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${formId}-key`}>
              {tc("key")} {editing ? null : <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={`${formId}-key`}
              className="font-mono"
              value={form.key}
              maxLength={100}
              disabled={Boolean(editing)}
              placeholder="ram_capacity"
              onChange={(event) => set({key: event.target.value})}
            />
            {editing ? null : <p className="text-xs text-muted-foreground">{tc("keyHint")}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-type`}>{tc("dataType")}</Label>
            <Select
              id={`${formId}-type`}
              value={form.dataType}
              disabled={Boolean(editing)}
              onChange={(event) => set({dataType: event.target.value as AttributeDataType})}
            >
              {ATTRIBUTE_DATA_TYPE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {tc(`dataTypes.${value}`)}
                </option>
              ))}
            </Select>
            {editing ? <p className="text-xs text-muted-foreground">{tc("lockedHint")}</p> : null}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${formId}-unit`}>{tc("unit")}</Label>
          <Input id={`${formId}-unit`} value={form.unit} maxLength={50} onChange={(event) => set({unit: event.target.value})} />
          <p className="text-xs text-muted-foreground">{tc("unitHint")}</p>
        </div>
        {hasAllowedValues ? (
          <div className="space-y-2">
            <Label htmlFor={`${formId}-values`}>
              {tc("allowedValues")} {isEnum ? <span className="text-destructive">*</span> : null}
            </Label>
            <Textarea
              id={`${formId}-values`}
              rows={4}
              value={form.allowedValues}
              onChange={(event) => set({allowedValues: event.target.value})}
            />
            <p className="text-xs text-muted-foreground">{tc(isEnum ? "allowedValuesHint" : "allowedValuesListHint")}</p>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor={`${formId}-aliases`}>{tc("aliases")}</Label>
          <Input id={`${formId}-aliases`} value={form.aliases} onChange={(event) => set({aliases: event.target.value})} />
          <p className="text-xs text-muted-foreground">{tc("aliasesHint")}</p>
        </div>
        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={form.filterable}
              onChange={(event) => set({filterable: event.target.checked})}
            />
            {tc("filterableLabel")}
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={form.comparable}
              onChange={(event) => set({comparable: event.target.checked})}
            />
            {tc("comparableLabel")}
          </label>
        </div>
        {problem ? (
          <p role="alert" className="text-sm text-destructive">
            {problem}
          </p>
        ) : null}
        {mutation.isError ? <ErrorMessage error={mutation.error} /> : null}
      </form>
    </Dialog>
  );
}

/* ----------------------------------------------------------------- specs form */

type CategoryRow = {id: string; name: string; depth: number};

function categoryRows(nodes: CategoryTree[], depth = 0): CategoryRow[] {
  return nodes.flatMap((node) => [
    ...(node.id ? [{id: node.id, name: node.name ?? "", depth}] : []),
    ...categoryRows(node.children ?? [], depth + 1),
  ]);
}

function SpecsPanel({onGoAttributes}: {onGoAttributes: () => void}) {
  const tc = useTranslations("admin.catalogConfig");
  const categories = useCategories();
  const [categoryId, setCategoryId] = useState("");
  const [keyword, setKeyword] = useState("");
  const rows = useMemo(() => categoryRows(categories.data ?? []), [categories.data]);
  const needle = keyword.trim().toLowerCase();
  const visible = needle ? rows.filter((row) => row.name.toLowerCase().includes(needle)) : rows;
  const selected = rows.find((row) => row.id === categoryId);

  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <Card className="p-3 lg:self-start">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={tc("searchCategory")}
            aria-label={tc("searchCategory")}
          />
        </div>
        <ul className="mt-3 max-h-[28rem] space-y-0.5 overflow-y-auto" aria-label={tc("category")}>
          {categories.isPending ? (
            <li>
              <Skeleton className="h-40 rounded-lg" />
            </li>
          ) : null}
          {visible.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                aria-current={row.id === categoryId}
                onClick={() => setCategoryId(row.id)}
                style={{paddingLeft: `${0.75 + (needle ? 0 : row.depth) * 1}rem`}}
                className={cn(
                  "w-full truncate rounded-lg py-2 pr-3 text-left text-sm transition",
                  row.id === categoryId ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:bg-muted",
                  !needle && row.depth === 0 && row.id !== categoryId && "font-medium",
                )}
              >
                {row.name}
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {selected ? (
        <TemplateEditor key={selected.id} categoryId={selected.id} categoryName={selected.name} onGoAttributes={onGoAttributes} />
      ) : (
        <Card className="flex min-h-64 items-center justify-center p-8 text-center text-sm text-muted-foreground">{tc("noCategory")}</Card>
      )}
    </div>
  );
}

type DraftItem = {uid: string; attributeId: string; required: boolean};

let draftSeq = 0;
const uid = () => `d${++draftSeq}`;

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** The part of a draft that is sent: what "has anything changed" compares. */
function plain(items: DraftItem[]) {
  return JSON.stringify(items.map((item) => [item.attributeId, item.required]));
}

function TemplateEditor({
  categoryId,
  categoryName,
  onGoAttributes,
}: {
  categoryId: string;
  categoryName: string;
  onGoAttributes: () => void;
}) {
  const specs = useCategorySpecsSchema(categoryId);
  // The save lives here: the form below is rebuilt from the saved data, and its own state would be lost with it.
  const save = useReplaceAdminCategorySpecs();
  if (specs.isPending) return <Skeleton className="h-72 rounded-2xl" />;
  if (specs.isError) return <ErrorMessage error={specs.error} />;
  const inherited = specs.data.attributes.filter((attribute) => attribute.inherited);
  const initial: DraftItem[] = specs.data.attributes
    .filter((attribute) => !attribute.inherited)
    .map((attribute) => ({
      uid: uid(),
      attributeId: attribute.attributeId,
      required: attribute.required,
    }));
  return (
    <TemplateForm
      key={`${categoryId}-${specs.dataUpdatedAt}`}
      categoryId={categoryId}
      categoryName={categoryName}
      initial={initial}
      inherited={inherited}
      save={save}
      onGoAttributes={onGoAttributes}
    />
  );
}

function TemplateForm({
  categoryId,
  categoryName,
  initial,
  inherited,
  save,
  onGoAttributes,
}: {
  categoryId: string;
  categoryName: string;
  initial: DraftItem[];
  inherited: AttributeSchemaItem[];
  save: ReturnType<typeof useReplaceAdminCategorySpecs>;
  onGoAttributes: () => void;
}) {
  const tc = useTranslations("admin.catalogConfig");
  const definitions = useAttributes();
  const [items, setItems] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const baseline = useMemo(() => plain(initial), [initial]);
  const dirty = plain(items) !== baseline;
  const defs = definitions.data ?? [];
  const byId = new Map(defs.map((definition) => [definition.id, definition]));
  const used = new Set([...inherited.map((attribute) => attribute.attributeId), ...items.map((item) => item.attributeId)].filter(Boolean));

  const patchItem = (index: number, patch: Partial<DraftItem>) =>
    setItems((current) => current.map((item, at) => (at === index ? {...item, ...patch} : item)));

  function validate(): string | null {
    const chosen = items.map((item) => item.attributeId);
    if (chosen.some((id) => !id)) return tc("problem.attributeMissing");
    if (new Set(chosen).size !== chosen.length) return tc("problem.attributeDuplicate");
    return null;
  }

  async function submit() {
    const found = validate();
    setProblem(found);
    if (found) return;
    try {
      await save.mutateAsync({
        categoryId,
        request: {
          attributes: items.map((item, index) => ({attributeId: item.attributeId, required: item.required, displayOrder: index})),
        },
      });
    } catch {
      // the failed mutation shows its own error
    }
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{tc("editorTitle", {name: categoryName})}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{tc("summary", {items: items.length, inherited: inherited.length})}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty ? (
            <span className="text-xs text-amber-600">{tc("unsaved")}</span>
          ) : save.isSuccess ? (
            <span className="text-xs text-emerald-600">{tc("saved")}</span>
          ) : null}
          {dirty ? (
            <Button
              type="button"
              variant="outline"
              disabled={save.isPending}
              onClick={() => {
                setItems(initial);
                setProblem(null);
              }}
            >
              {tc("revert")}
            </Button>
          ) : null}
          <Button type="button" disabled={!dirty || save.isPending} onClick={() => void submit()}>
            {tc("save")}
          </Button>
        </div>
      </div>

      {definitions.isSuccess && defs.length === 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {tc("noDefinitions")}
          <Button type="button" size="sm" variant="outline" onClick={onGoAttributes}>
            {tc("goAttributes")}
          </Button>
        </div>
      ) : null}

      {inherited.length > 0 ? (
        <section className="mt-5" aria-label={tc("inheritedTitle")}>
          <h3 className="text-sm font-medium">{tc("inheritedTitle")}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{tc("inheritedHint")}</p>
          <ul className="mt-2 divide-y rounded-xl border bg-muted/30">
            {inherited.map((attribute) => (
              <li key={attribute.attributeId} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm">
                <span className="min-w-52 flex-1 font-medium">
                  {attribute.displayName} <span className="font-normal text-muted-foreground">({attribute.key})</span>
                </span>
                <span className="flex w-28 items-center gap-1.5 text-xs text-muted-foreground">
                  {attribute.dataType ? (
                    <Badge className={cn("px-2 py-0", TYPE_TONE[attribute.dataType])}>{tc(`dataTypes.${attribute.dataType}`)}</Badge>
                  ) : null}
                  {attribute.unit}
                </span>
                {attribute.required ? <span className="text-xs text-muted-foreground">{tc("required")}</span> : null}
                <Badge className="px-2 py-0 text-xs">{tc("inheritedFrom", {name: attribute.sourceCategoryName ?? ""})}</Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="font-medium">{tc("emptyTemplate")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tc("emptyTemplateHint")}</p>
          </div>
        ) : (
          <ul className="divide-y rounded-xl border">
            {items.map((item, index) => {
              const definition = byId.get(item.attributeId);
              return (
                <li key={item.uid} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                  <div className="flex">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={tc("moveUp")}
                      disabled={index === 0}
                      onClick={() => setItems((current) => move(current, index, -1))}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={tc("moveDown")}
                      disabled={index === items.length - 1}
                      onClick={() => setItems((current) => move(current, index, 1))}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                  <Select
                    className="h-9 min-w-52 flex-1"
                    aria-label={tc("pickAttribute")}
                    value={item.attributeId}
                    onChange={(event) => patchItem(index, {attributeId: event.target.value})}
                  >
                    <option value="">{tc("pickAttribute")}</option>
                    {defs
                      .filter((candidate) => candidate.id === item.attributeId || !used.has(candidate.id))
                      .map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.displayName} ({candidate.key})
                        </option>
                      ))}
                  </Select>
                  <span className="flex w-28 items-center gap-1.5 text-xs text-muted-foreground">
                    {definition?.dataType ? (
                      <Badge className={cn("px-2 py-0", TYPE_TONE[definition.dataType])}>{tc(`dataTypes.${definition.dataType}`)}</Badge>
                    ) : null}
                    {definition?.unit}
                  </span>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={item.required}
                      onChange={(event) => patchItem(index, {required: event.target.checked})}
                    />
                    {tc("required")}
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={tc("removeItem")}
                    onClick={() => setItems((current) => current.filter((_, at) => at !== index))}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={() => setItems((current) => [...current, {uid: uid(), attributeId: "", required: false}])}
        >
          <Plus className="size-4" />
          {tc("addAttribute")}
        </Button>
      </div>

      {problem || save.isError ? (
        <div role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {problem ?? <ErrorMessage error={save.error} />}
        </div>
      ) : null}
    </Card>
  );
}
