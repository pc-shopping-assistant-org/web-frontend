"use client";

import {ChevronRight, Plus} from "lucide-react";
import {useTranslations} from "next-intl";
import {useId, useState, type FormEvent} from "react";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {ConfirmAction} from "@/components/ui/confirm-action";
import {Dialog} from "@/components/ui/dialog";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusBadge} from "@/components/ui/status-badge";
import {Textarea} from "@/components/ui/textarea";
import type {CategoryTree} from "@/features/catalog/contracts/responses";
import {ResourceStatus, type EditableResourceStatus} from "@/lib/domain/catalog-enums";
import {cn} from "@/lib/utils";

import {flattenCategories} from "./list-helpers";
import {useAdminCategories, useCreateAdminCategory, useDeleteAdminCategory, useUpdateAdminCategory} from "./queries";

/** What the dialog is for: a new category (maybe already under a parent) or the edit of one. */
type DialogState = {mode: "create"; parentId?: string} | {mode: "edit"; category: CategoryTree};

const INDENT_REM = 1.5;

type Row = {category: CategoryTree; depth: number};

/** The tree as the rows on screen: a folded category hides everything under it. */
function visibleRows(nodes: CategoryTree[], folded: Set<string>, depth = 0): Row[] {
  return nodes.flatMap((category) => [
    {category, depth},
    ...(category.id && folded.has(category.id) ? [] : visibleRows(category.children ?? [], folded, depth + 1)),
  ]);
}

function idsUnder(category: CategoryTree): Set<string> {
  const ids = new Set<string>();
  const walk = (node: CategoryTree) => {
    if (node.id) ids.add(node.id);
    (node.children ?? []).forEach(walk);
  };
  walk(category);
  return ids;
}

export function CategoryManagement() {
  const t = useTranslations("admin");
  const tc = useTranslations("admin.categoryPage");
  const categories = useAdminCategories();
  const remove = useDeleteAdminCategory();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [folded, setFolded] = useState<Set<string>>(new Set());
  const tree = categories.data ?? [];
  const rows = visibleRows(tree, folded);

  function toggle(id: string) {
    setFolded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("nav.categories")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("categoriesDescription")}</p>
        </div>
        <Button type="button" size="lg" onClick={() => setDialog({mode: "create"})}>
          <Plus className="size-4" />
          {tc("addNew")}
        </Button>
      </div>

      <Card className="p-4 sm:p-5">
        {categories.isPending ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : categories.isError ? (
          <ErrorMessage error={categories.error} />
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">{tc("empty")}</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">{tc("name")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("description")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("status")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{tc("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({category, depth}) => {
                  const children = category.children ?? [];
                  const open = !(category.id && folded.has(category.id));
                  return (
                    <tr key={category.id} className="border-t transition hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5" style={{paddingLeft: `${depth * INDENT_REM}rem`}}>
                          {children.length > 0 ? (
                            <button
                              type="button"
                              aria-expanded={open}
                              aria-label={tc(open ? "fold" : "unfold", {name: category.name ?? ""})}
                              onClick={() => toggle(category.id!)}
                              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                              <ChevronRight className={cn("size-4 transition", open && "rotate-90")} />
                            </button>
                          ) : (
                            <span className="size-6 shrink-0" aria-hidden="true" />
                          )}
                          <span className={cn("min-w-0 truncate", depth === 0 && "font-medium")}>{category.name}</span>
                          {children.length > 0 ? (
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{children.length}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="max-w-xs px-4 py-3 text-muted-foreground">
                        <span className="line-clamp-1" title={category.description ?? undefined}>{category.description || "—"}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={category.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <Button type="button" variant="link" size="xs" className="h-auto p-0 text-sm font-medium" onClick={() => setDialog({mode: "edit", category})}>
                            {tc("edit")}
                          </Button>
                          <Button type="button" variant="link" size="xs" className="h-auto p-0 text-sm font-medium" onClick={() => setDialog({mode: "create", parentId: category.id})}>
                            {tc("addChild")}
                          </Button>
                          <ConfirmAction
                            title={t("delete")}
                            description={t("confirmDelete")}
                            confirmLabel={t("delete")}
                            cancelLabel={t("cancel")}
                            onConfirm={() => remove.mutateAsync(category.id!)}
                            variant="link"
                            size="xs"
                            className="h-auto p-0 text-sm font-medium text-destructive"
                          >
                            {t("delete")}
                          </ConfirmAction>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {dialog ? <CategoryDialog key={dialog.mode === "edit" ? dialog.category.id : `new-${dialog.parentId ?? ""}`} state={dialog} tree={tree} onClose={() => setDialog(null)} /> : null}
    </section>
  );
}

/** One dialog for both: the same fields, and a status only when editing. */
function CategoryDialog({state, tree, onClose}: {state: DialogState; tree: CategoryTree[]; onClose: () => void}) {
  const t = useTranslations("admin");
  const tc = useTranslations("admin.categoryPage");
  const formId = useId();
  const create = useCreateAdminCategory();
  const update = useUpdateAdminCategory();
  const editing = state.mode === "edit" ? state.category : null;
  const mutation = editing ? update : create;
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    seoName: editing?.seoName ?? "",
    description: editing?.description ?? "",
    parentId: editing ? (editing.parentId ?? "") : (state.mode === "create" ? (state.parentId ?? "") : ""),
    status: (editing?.status as EditableResourceStatus | undefined) ?? ResourceStatus.Active,
  });
  /** A category cannot go under itself or under one of its own children. */
  const blocked = editing ? idsUnder(editing) : new Set<string>();
  const parents = flattenCategories(tree).filter((item) => !blocked.has(item.id));
  const set = (patch: Partial<typeof form>) => setForm((current) => ({...current, ...patch}));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = {
      name: form.name.trim(),
      seoName: form.seoName.trim(),
      description: form.description.trim(),
      parentId: form.parentId || undefined,
    };
    try {
      if (editing) await update.mutateAsync({id: editing.id!, request: {...body, status: form.status}});
      else await create.mutateAsync(body);
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
          <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>{t("cancel")}</Button>
          <Button type="submit" form={formId} disabled={mutation.isPending || !form.name.trim()}>
            {editing ? t("save") : tc("create")}
          </Button>
        </>
      }
    >
      <form id={formId} className="grid grid-cols-[minmax(0,1fr)] gap-4" onSubmit={(event) => void submit(event)}>
        <div className="space-y-2">
          <Label htmlFor={`${formId}-name`}>{t("name")} <span className="text-destructive">*</span></Label>
          <Input id={`${formId}-name`} data-autofocus value={form.name} maxLength={255} required onChange={(event) => set({name: event.target.value})} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${formId}-parent`}>{t("parentCategory")}</Label>
          <Select id={`${formId}-parent`} value={form.parentId} onChange={(event) => set({parentId: event.target.value})}>
            <option value="">{t("rootCategory")}</option>
            {parents.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${formId}-seo`}>{t("seoName")}</Label>
          <Input id={`${formId}-seo`} value={form.seoName} maxLength={255} onChange={(event) => set({seoName: event.target.value})} />
        </div>
        {editing ? (
          <div className="space-y-2">
            <Label htmlFor={`${formId}-status`}>{t("status")}</Label>
            <Select id={`${formId}-status`} value={form.status} onChange={(event) => set({status: event.target.value as EditableResourceStatus})}>
              <option value={ResourceStatus.Active}>{t(`statusValues.${ResourceStatus.Active}`)}</option>
              <option value={ResourceStatus.Inactive}>{t(`statusValues.${ResourceStatus.Inactive}`)}</option>
            </Select>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor={`${formId}-description`}>{t("description")}</Label>
          <Textarea id={`${formId}-description`} value={form.description} onChange={(event) => set({description: event.target.value})} />
        </div>
        {mutation.isError ? <ErrorMessage error={mutation.error} /> : null}
      </form>
    </Dialog>
  );
}
