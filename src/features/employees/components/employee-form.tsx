"use client";

import {LoaderCircle, Upload} from "lucide-react";
import Image from "next/image";
import {useTranslations} from "next-intl";
import {useState, type ChangeEvent, type ReactNode} from "react";

import {Button} from "@/components/ui/button";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {useUploadAvatar} from "@/features/auth/queries";
import {ApiClientError} from "@/lib/api/envelope";
import {EMPLOYEE_GENDER_VALUES, type EmployeeGender} from "@/lib/domain/account-enums";

import {
  EMPLOYEE_ADDRESS_MAX_LENGTH,
  EMPLOYEE_NAME_MAX_LENGTH,
  EMPLOYEE_PASSWORD_MAX_LENGTH,
  EMPLOYEE_PASSWORD_MIN_LENGTH,
} from "../contracts/requests";
import type {EmployeeFormValues} from "../employee-form-values";

function Field({id, label, invalid, children}: {id: string; label: string; invalid: boolean; children: ReactNode}) {
  const t = useTranslations("employees");
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}{invalid ? <p className="text-xs text-destructive">{t("invalidField")}</p> : null}</div>;
}

/**
 * The fields of an employee, for adding one and for editing one. The password is asked only when adding: an employee
 * is edited without it, and the role is not a field, because the backend fixes it.
 */
export function EmployeeForm({
  idPrefix,
  initial,
  askPassword,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  idPrefix: string;
  initial: EmployeeFormValues;
  askPassword: boolean;
  submitLabel: string;
  pending: boolean;
  error: unknown;
  onSubmit: (values: EmployeeFormValues) => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("employees");
  const [values, setValues] = useState(initial);
  const set = <K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) => setValues((current) => ({...current, [key]: value}));
  const id = (name: string) => `${idPrefix}-${name}`;
  // The backend and the request check both name the fields they refuse, so the form can point at them.
  const refused = new Set(error instanceof ApiClientError ? error.errors.map((item) => item.field) : []);
  const flag = (name: string) => refused.has(name) ? {"aria-invalid": true, className: "border-destructive"} : {};

  return <form
    method="post"
    className="grid gap-4 sm:grid-cols-2"
    onSubmit={(event) => {
      event.preventDefault();
      onSubmit(values);
    }}
  >
    <AvatarPicker id={id("avatar")} url={values.avatarUrl} onUploaded={(file) => setValues((current) => ({...current, avatarFileId: file.id, avatarUrl: file.url}))} />
    <Field id={id("last-name")} invalid={refused.has("lastName")} label={t("lastName")}>
      <Input id={id("last-name")} {...flag("lastName")} value={values.lastName} maxLength={EMPLOYEE_NAME_MAX_LENGTH} required onChange={(event) => set("lastName", event.target.value)} />
    </Field>
    <Field id={id("first-name")} invalid={refused.has("firstName")} label={t("firstName")}>
      <Input id={id("first-name")} {...flag("firstName")} value={values.firstName} maxLength={EMPLOYEE_NAME_MAX_LENGTH} required onChange={(event) => set("firstName", event.target.value)} />
    </Field>
    <Field id={id("email")} invalid={refused.has("email")} label={t("email")}>
      <Input id={id("email")} {...flag("email")} type="email" value={values.email} required onChange={(event) => set("email", event.target.value)} />
    </Field>
    <Field id={id("phone")} invalid={refused.has("phone")} label={t("phone")}>
      <Input id={id("phone")} {...flag("phone")} type="tel" value={values.phone} required onChange={(event) => set("phone", event.target.value)} />
    </Field>
    {askPassword ? <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={id("password")}>{t("initialPassword")}</Label>
      <Input
        id={id("password")}
        {...flag("password")}
        type="password"
        autoComplete="new-password"
        value={values.password}
        minLength={EMPLOYEE_PASSWORD_MIN_LENGTH}
        maxLength={EMPLOYEE_PASSWORD_MAX_LENGTH}
        required
        onChange={(event) => set("password", event.target.value)}
      />
      <p className={`text-xs ${refused.has("password") ? "text-destructive" : "text-muted-foreground"}`}>{t("passwordHint", {min: EMPLOYEE_PASSWORD_MIN_LENGTH})}</p>
    </div> : null}
    <Field id={id("gender")} invalid={refused.has("gender")} label={t("gender")}>
      <Select id={id("gender")} value={values.gender} onChange={(event) => set("gender", event.target.value as EmployeeGender)}>
        {EMPLOYEE_GENDER_VALUES.map((gender) => <option key={gender} value={gender}>{t(`genders.${gender}`)}</option>)}
      </Select>
    </Field>
    <Field id={id("birthday")} invalid={refused.has("birthday")} label={t("birthday")}>
      <Input id={id("birthday")} {...flag("birthday")} type="date" max={new Date().toISOString().slice(0, 10)} value={values.birthday} onChange={(event) => set("birthday", event.target.value)} />
    </Field>
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={id("address")}>{t("address")}</Label>
      <Textarea id={id("address")} {...flag("address")} value={values.address} maxLength={EMPLOYEE_ADDRESS_MAX_LENGTH} onChange={(event) => set("address", event.target.value)} />
    </div>
    {error ? <div className="sm:col-span-2"><ErrorMessage error={error} /></div> : null}
    <div className="flex gap-2 sm:col-span-2">
      <Button type="submit" disabled={pending}>{submitLabel}</Button>
      {onCancel ? <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>{t("cancel")}</Button> : null}
    </div>
  </form>;
}

/** The avatar goes to the Media Service first; the form keeps the id it answers with and the URL to show. */
function AvatarPicker({id, url, onUploaded}: {id: string; url?: string; onUploaded: (image: {id: string; url: string}) => void}) {
  const t = useTranslations("employees");
  const upload = useUploadAvatar();
  const [error, setError] = useState<unknown>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    try {
      onUploaded(await upload.mutateAsync(file));
    } catch (cause) {
      setError(cause);
    }
  }

  return <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-muted/20 p-4 sm:col-span-2">
    <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
      {url ? <Image src={url} alt="" fill sizes="64px" unoptimized className="object-cover" /> : <Upload className="size-5" aria-hidden="true" />}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold">{t("avatar")}</p>
      <label htmlFor={id} className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5">
        {upload.isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
        {upload.isPending ? t("uploadingAvatar") : t("chooseAvatar")}
      </label>
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => void handleChange(event)} disabled={upload.isPending} />
    </div>
    {error ? <div className="w-full"><ErrorMessage error={error} /></div> : null}
  </div>;
}
