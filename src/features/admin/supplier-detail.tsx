"use client";

import {Save, Trash2} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState, type FormEvent} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {useRouter} from "@/i18n/navigation";
import type {UpdateSupplierRequest} from "@/features/admin/contracts/requests";
import {ResourceStatus, type EditableResourceStatus} from "@/lib/domain/catalog-enums";
import {ConfirmAction} from "./confirm-action";
import {useAdminSupplier, useDeleteAdminSupplier, useUpdateAdminSupplier} from "./queries";
import {BackLink, Loading, Failure, Field, FormError} from "./detail-kit";

export function AdminSupplierDetailPage({supplierId}: {supplierId: string}) {
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
        onSave={(request) => update.mutateAsync({id: supplierId, request})}
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
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}>
          <Field
            id="supplier-name"
            label={t("name")}
            value={form.name}
            onChange={(next) => setForm((current) => ({...current, name: next}))}
            required
          />
          <Field
            id="supplier-email"
            label={t("email")}
            type="email"
            value={form.email}
            onChange={(next) => setForm((current) => ({...current, email: next}))}
          />
          <Field
            id="supplier-phone"
            label={t("phone")}
            value={form.phone}
            onChange={(next) => setForm((current) => ({...current, phone: next}))}
          />
          <Field
            id="supplier-address"
            label={t("address")}
            value={form.address}
            onChange={(next) => setForm((current) => ({...current, address: next}))}
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
