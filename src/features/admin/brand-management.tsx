"use client";

import {Building2, Plus} from "lucide-react";
import Image from "next/image";
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
import type {Brand} from "@/features/catalog/contracts/responses";
import {ResourceStatus, type EditableResourceStatus} from "@/lib/domain/catalog-enums";

import {FileUploadField, type UploadedFile} from "./file-upload";
import {useAdminBrands, useCreateAdminBrand, useDeleteAdminBrand, useUpdateAdminBrand} from "./queries";

/** What the dialog is for: a new brand or the edit of one. */
type DialogState = {mode: "create"} | {mode: "edit"; brand: Brand};

export function BrandManagement() {
  const t = useTranslations("admin");
  const tb = useTranslations("admin.brandPage");
  const brands = useAdminBrands();
  const remove = useDeleteAdminBrand();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const rows = brands.data ?? [];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("nav.brands")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("brandsDescription")}</p>
        </div>
        <Button type="button" size="lg" onClick={() => setDialog({mode: "create"})}>
          <Plus className="size-4" />
          {tb("addNew")}
        </Button>
      </div>

      <Card className="p-4 sm:p-5">
        {brands.isPending ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : brands.isError ? (
          <ErrorMessage error={brands.error} />
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">{tb("empty")}</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {tb("name")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {t("description")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {t("status")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {tb("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((brand) => (
                  <tr key={brand.id} className="border-t transition hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {brand.logoUrl ? (
                          <Image
                            src={brand.logoUrl}
                            alt=""
                            width={36}
                            height={36}
                            unoptimized
                            className="size-9 shrink-0 rounded-lg border bg-white object-contain"
                          />
                        ) : (
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Building2 className="size-4" aria-hidden="true" />
                          </span>
                        )}
                        <span className="min-w-0 truncate font-medium">{brand.name}</span>
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-muted-foreground">
                      <span className="line-clamp-1" title={brand.description ?? undefined}>
                        {brand.description || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={brand.status} />
                    </td>
                    <td className="px-4 py-3">
                      {brand.id ? (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <Button
                            type="button"
                            variant="link"
                            size="xs"
                            className="h-auto p-0 text-sm font-medium"
                            onClick={() => setDialog({mode: "edit", brand})}
                          >
                            {tb("edit")}
                          </Button>
                          <ConfirmAction
                            title={t("delete")}
                            description={t("confirmDelete")}
                            confirmLabel={t("delete")}
                            cancelLabel={t("cancel")}
                            onConfirm={() => remove.mutateAsync(brand.id!)}
                            variant="link"
                            size="xs"
                            className="h-auto p-0 text-sm font-medium text-destructive"
                          >
                            {t("delete")}
                          </ConfirmAction>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {dialog ? (
        <BrandDialog key={dialog.mode === "edit" ? dialog.brand.id : "new"} state={dialog} onClose={() => setDialog(null)} />
      ) : null}
    </section>
  );
}

/** One dialog for both: the same fields, and a status only when editing. */
function BrandDialog({state, onClose}: {state: DialogState; onClose: () => void}) {
  const t = useTranslations("admin");
  const tb = useTranslations("admin.brandPage");
  const formId = useId();
  const create = useCreateAdminBrand();
  const update = useUpdateAdminBrand();
  const editing = state.mode === "edit" ? state.brand : null;
  const mutation = editing ? update : create;
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    file: editing?.imageFileId ? ({id: editing.imageFileId} as UploadedFile) : null,
    status: (editing?.status as EditableResourceStatus | undefined) ?? ResourceStatus.Active,
  });
  const set = (patch: Partial<typeof form>) => setForm((current) => ({...current, ...patch}));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      imageFileId: form.file?.id,
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
      title={editing ? tb("editTitle") : tb("addTitle")}
      description={editing ? undefined : tb("addDescription")}
      footer={
        <>
          <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" form={formId} disabled={mutation.isPending || !form.name.trim()}>
            {editing ? t("save") : tb("create")}
          </Button>
        </>
      }
    >
      <form id={formId} className="grid grid-cols-[minmax(0,1fr)] gap-4" onSubmit={(event) => void submit(event)}>
        <div className="space-y-2">
          <Label htmlFor={`${formId}-name`}>
            {t("name")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${formId}-name`}
            data-autofocus
            value={form.name}
            maxLength={255}
            required
            onChange={(event) => set({name: event.target.value})}
          />
        </div>
        <FileUploadField
          id={`${formId}-file`}
          label={t("brandLogo")}
          currentFileId={editing?.imageFileId && !form.file?.originalName ? editing.imageFileId : undefined}
          value={form.file?.originalName ? [form.file] : []}
          onUploaded={(file) => set({file})}
          onRemove={() => set({file: null})}
        />
        {editing ? (
          <div className="space-y-2">
            <Label htmlFor={`${formId}-status`}>{t("status")}</Label>
            <Select
              id={`${formId}-status`}
              value={form.status}
              onChange={(event) => set({status: event.target.value as EditableResourceStatus})}
            >
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
