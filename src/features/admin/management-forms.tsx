"use client";

import {ChevronDown, ChevronUp, Plus} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState, type FormEvent} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {useCreateAdminSupplier} from "./queries";

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
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} disabled={disabled} />
    </div>
  );
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
      <Button type="button" variant="outline" size="sm" aria-expanded={open} onClick={onToggle}>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
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
    setForm({name: "", email: "", phone: "", address: "", description: ""});
  }
  return (
    <Card className="mb-6">
      <CreateCardHeader title={t("createSupplier")} open={open} onToggle={() => setOpen((value) => !value)} />
      {open ? (
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}>
            <Field
              id="new-supplier-name"
              label={t("name")}
              value={form.name}
              onChange={(value) => setForm((current) => ({...current, name: value}))}
              required
            />
            <Field
              id="new-supplier-email"
              label={t("email")}
              type="email"
              value={form.email}
              onChange={(value) => setForm((current) => ({...current, email: value}))}
            />
            <Field
              id="new-supplier-phone"
              label={t("phone")}
              value={form.phone}
              onChange={(value) => setForm((current) => ({...current, phone: value}))}
            />
            <Field
              id="new-supplier-address"
              label={t("address")}
              value={form.address}
              onChange={(value) => setForm((current) => ({...current, address: value}))}
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-supplier-description">{t("description")}</Label>
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
              <Button type="submit" disabled={create.isPending || !form.name.trim()}>
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
