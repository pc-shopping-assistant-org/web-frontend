"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "@/i18n/navigation";
import {Link} from "@/i18n/navigation";
import {useTranslations} from "next-intl";
import {useForm} from "react-hook-form";
import {z} from "zod";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {ErrorMessage} from "@/components/ui/error-message";

import {login} from "./api";

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
      await login(values.identifier, values.password);
      router.push("/account");
      router.refresh();
    } catch (error) {
      form.setError("root", {message: error instanceof Error ? error.message : "UNKNOWN"});
    }
  });

  return <form className="space-y-5" onSubmit={(event) => void submit(event)} noValidate>
    <div className="space-y-2"><Label htmlFor="identifier">{t("email")} / {t("phone")}</Label><Input id="identifier" autoComplete="username" {...form.register("identifier")} aria-invalid={Boolean(form.formState.errors.identifier)} />{form.formState.errors.identifier ? <p className="text-xs text-destructive">{common("validation")}</p> : null}</div>
    <div className="space-y-2"><Label htmlFor="password">{t("password")}</Label><Input id="password" type="password" autoComplete="current-password" {...form.register("password")} aria-invalid={Boolean(form.formState.errors.password)} />{form.formState.errors.password ? <p className="text-xs text-destructive">{common("validation")}</p> : null}</div>
    {form.formState.errors.root ? <ErrorMessage error={form.formState.errors.root.message} fallback={form.formState.errors.root.message} /> : null}
    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? common("loading") : t("login")}</Button>
    <Link href="/forgot-password" className="block text-center text-sm text-muted-foreground hover:text-foreground hover:underline">{t("forgotPassword")}</Link>
  </form>;
}
