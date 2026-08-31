"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "@/i18n/navigation";
import {useTranslations} from "next-intl";
import {useForm} from "react-hook-form";
import type {UseFormRegisterReturn} from "react-hook-form";
import {z} from "zod";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {ApiClientError} from "@/lib/api/envelope";
import {backendFetch} from "@/lib/api/client";
import type {RegisterRequest} from "@/lib/api/types";

const registerSchema = z.object({fullName: z.string().min(2), email: z.email(), phone: z.string().min(6), password: z.string().min(8), address: z.string().min(5)});
type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<RegisterFormValues>({resolver: zodResolver(registerSchema), defaultValues: {fullName: "", email: "", phone: "", password: "", address: ""}});
  const submit = form.handleSubmit(async (values) => {
    try {
      const payload: RegisterRequest = values;
      await backendFetch<string>("/auth/register", {method: "POST", body: JSON.stringify(payload)});
      router.push("/login");
    } catch (error) {
      form.setError("root", {message: error instanceof ApiClientError ? error.messageKey : "UNKNOWN"});
    }
  });
  return <form className="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
    <Field id="fullName" label={t("fullName")} register={form.register("fullName")} />
    <Field id="email" type="email" label={t("email")} register={form.register("email")} />
    <Field id="phone" label={t("phone")} register={form.register("phone")} />
    <Field id="password" type="password" label={t("password")} register={form.register("password")} />
    <Field id="address" label="Address" register={form.register("address")} />
    {form.formState.errors.root ? <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{form.formState.errors.root.message === "VALIDATION_ERROR" ? t("registerFailed") : common("unknownError")}</p> : null}
    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? common("loading") : t("register")}</Button>
  </form>;
}

function Field({id, label, type = "text", register}: {id: string; label: string; type?: string; register: UseFormRegisterReturn}) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} {...register} /></div>;
}
