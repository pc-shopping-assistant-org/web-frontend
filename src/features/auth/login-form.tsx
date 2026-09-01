"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "@/i18n/navigation";
import {Link} from "@/i18n/navigation";
import {useTranslations} from "next-intl";
import {useForm} from "react-hook-form";
import {useState} from "react";
import {z} from "zod";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {ErrorMessage} from "@/components/ui/error-message";

import {login} from "./api";
import {GoogleLoginButton} from "./google-login-button";
import {loginRequestSchema} from "@/features/auth/contracts/requests";

type LoginFormValues = z.infer<typeof loginRequestSchema>;

export function LoginForm({redirectTo}: {redirectTo?: string} = {}) {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const router = useRouter();
  const [error, setError] = useState<unknown>(null);
  const form = useForm<LoginFormValues>({resolver: zodResolver(loginRequestSchema), defaultValues: {identifier: "", password: ""}});
  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values);
      router.push(redirectTo?.startsWith("/") ? redirectTo : "/account");
      router.refresh();
    } catch (error) {
      setError(error);
    }
  });

  return <form className="space-y-5" onSubmit={(event) => void submit(event)} noValidate>
    <div className="space-y-2"><Label htmlFor="identifier">{t("email")} / {t("phone")}</Label><Input id="identifier" autoComplete="username" {...form.register("identifier")} aria-invalid={Boolean(form.formState.errors.identifier)} />{form.formState.errors.identifier ? <p className="text-xs text-destructive">{common("validation")}</p> : null}</div>
    <div className="space-y-2"><Label htmlFor="password">{t("password")}</Label><Input id="password" type="password" autoComplete="current-password" {...form.register("password")} aria-invalid={Boolean(form.formState.errors.password)} />{form.formState.errors.password ? <p className="text-xs text-destructive">{common("validation")}</p> : null}</div>
    {error ? <ErrorMessage error={error} /> : null}
    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? common("loading") : t("login")}</Button>
    <GoogleLoginButton redirectTo={redirectTo} />
    <Link href="/forgot-password" className="block text-center text-sm text-muted-foreground hover:text-foreground hover:underline">{t("forgotPassword")}</Link>
  </form>;
}
