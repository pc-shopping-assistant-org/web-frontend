"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {useTranslations} from "next-intl";
import {useState, type FormEvent} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";

import {Button} from "@/components/ui/button";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Link} from "@/i18n/navigation";

import {requestPasswordReset, resetPassword, resendOtp} from "./api";

const requestSchema = z.object({identifier: z.string().trim().min(1)});
const resetSchema = z.object({otp: z.string().regex(/^\d{6}$/), newPassword: z.string().min(8).regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$/), confirmPassword: z.string()}).refine((value) => value.newPassword === value.confirmPassword, {path: ["confirmPassword"], message: "PASSWORD_MISMATCH"});

export function PasswordRecoveryForm() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);
  const requestForm = useForm<z.infer<typeof requestSchema>>({resolver: zodResolver(requestSchema), defaultValues: {identifier: ""}});
  const resetForm = useForm<z.infer<typeof resetSchema>>({resolver: zodResolver(resetSchema), defaultValues: {otp: "", newPassword: "", confirmPassword: ""}});

  const submitRequest = requestForm.handleSubmit(async ({identifier: value}) => {
    setError(null);
    try {
      await requestPasswordReset(value.includes("@") ? {email: value} : {phone: value});
      setIdentifier(value);
    } catch (cause) {
      setError(cause);
    }
  });

  const submitReset = resetForm.handleSubmit(async ({otp, newPassword}) => {
    if (!identifier) return;
    setError(null);
    try {
      await resetPassword(identifier.includes("@") ? {email: identifier, otp, newPassword} : {phone: identifier, otp, newPassword});
      setDone(true);
    } catch (cause) {
      setError(cause);
    }
  });

  if (done) return <div className="space-y-4"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{t("passwordResetSuccess")}</div><Link href="/login" className="text-sm font-medium hover:underline">{t("backToLogin")}</Link></div>;

  if (identifier) {
    const resend = async () => {
      if (!identifier.includes("@")) return;
      try {
        await resendOtp({email: identifier, purpose: "FORGOT_PASSWORD"});
        setError(null);
      } catch (cause) {
        setError(cause);
      }
    };
    return <form className="space-y-5" onSubmit={(event: FormEvent) => void submitReset(event)} noValidate>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{t("resetOtpSent", {identifier})}</div>
      <div className="space-y-2"><Label htmlFor="otp">{t("otp")}</Label><Input id="otp" inputMode="numeric" maxLength={6} {...resetForm.register("otp")} /></div>
      <div className="space-y-2"><Label htmlFor="new-password">{t("newPassword")}</Label><Input id="new-password" type="password" autoComplete="new-password" {...resetForm.register("newPassword")} /></div>
      <div className="space-y-2"><Label htmlFor="confirm-password">{t("confirmPassword")}</Label><Input id="confirm-password" type="password" autoComplete="new-password" {...resetForm.register("confirmPassword")} /></div>
      {error ? <ErrorMessage error={error} fallback={error instanceof Error ? error.message : "UNKNOWN"} /> : null}
      <Button type="submit" className="w-full" disabled={resetForm.formState.isSubmitting}>{resetForm.formState.isSubmitting ? common("loading") : t("resetPassword")}</Button>
      {identifier.includes("@") ? <Button type="button" variant="outline" className="w-full" onClick={() => void resend()}>{t("resendOtp")}</Button> : null}
    </form>;
  }

  return <form className="space-y-5" onSubmit={(event: FormEvent) => void submitRequest(event)} noValidate>
    <div className="space-y-2"><Label htmlFor="identifier">{t("email")}/{t("phone")}</Label><Input id="identifier" autoComplete="username" placeholder={t("identifierPlaceholder")} {...requestForm.register("identifier")} /></div>
    {error ? <ErrorMessage error={error} fallback={error instanceof Error ? error.message : "UNKNOWN"} /> : null}
    <Button type="submit" className="w-full" disabled={requestForm.formState.isSubmitting}>{requestForm.formState.isSubmitting ? common("loading") : t("sendResetOtp")}</Button>
  </form>;
}
