"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "@/i18n/navigation";
import {useTranslations} from "next-intl";
import {useForm} from "react-hook-form";
import {z} from "zod";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {ApiClientError} from "@/lib/api/envelope";
import {backendFetch} from "@/lib/api/client";
import type {AuthResponse, LoginRequest} from "@/lib/api/types";

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<LoginFormValues>({resolver: zodResolver(loginSchema), defaultValues: {identifier: "", password: ""}});
  const submit = form.handleSubmit(async (values) => {
    try {
      const payload: LoginRequest = values;
      await backendFetch<AuthResponse>("/auth/login", {method: "POST", body: JSON.stringify(payload)});
      router.push("/account");
      router.refresh();
    } catch (error) {
      form.setError("root", {message: error instanceof ApiClientError ? error.messageKey : "UNKNOWN"});
    }
  });

  return <form className="space-y-5" onSubmit={(event) => void submit(event)} noValidate>
    <div className="space-y-2"><Label htmlFor="identifier">{t("email")} / {t("phone")}</Label><Input id="identifier" autoComplete="username" {...form.register("identifier")} aria-invalid={Boolean(form.formState.errors.identifier)} />{form.formState.errors.identifier ? <p className="text-xs text-destructive">{common("validation")}</p> : null}</div>
    <div className="space-y-2"><Label htmlFor="password">{t("password")}</Label><Input id="password" type="password" autoComplete="current-password" {...form.register("password")} aria-invalid={Boolean(form.formState.errors.password)} />{form.formState.errors.password ? <p className="text-xs text-destructive">{common("validation")}</p> : null}</div>
    {form.formState.errors.root ? <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{form.formState.errors.root.message === "INVALID_CREDENTIALS" ? t("loginFailed") : common("unknownError")}</p> : null}
    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? common("loading") : t("login")}</Button>
  </form>;
}
