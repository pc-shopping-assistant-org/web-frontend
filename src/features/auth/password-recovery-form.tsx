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

import {requestPasswordReset, resetPassword} from "./api";

const requestSchema = z.object({identifier: z.email()});
const resetSchema = z.object({otp: z.string().regex(/^\d{6}$/), newPassword: z.string().min(8).regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$/), confirmPassword: z.string()}).refine((value) => value.newPassword === value.confirmPassword, {path: ["confirmPassword"], message: "PASSWORD_MISMATCH"});

export function PasswordRecoveryForm() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [resent, setResent] = useState(false);
  const [done, setDone] = useState(false);
  const requestForm = useForm<z.infer<typeof requestSchema>>({resolver: zodResolver(requestSchema), defaultValues: {identifier: ""}});
  const resetForm = useForm<z.infer<typeof resetSchema>>({resolver: zodResolver(resetSchema), defaultValues: {otp: "", newPassword: "", confirmPassword: ""}});

  const submitRequest = requestForm.handleSubmit(async ({identifier: value}) => {
    setError(null);
    setResent(false);
    try {
      await requestPasswordReset({email: value});
      setIdentifier(value);
    } catch (cause) {
      setError(cause);
    }
  });

  const submitReset = resetForm.handleSubmit(async ({otp, newPassword}) => {
    if (!identifier) return;
    setError(null);
    try {
      await resetPassword({email: identifier, otp, newPassword});
      setDone(true);
    } catch (cause) {
      setError(cause);
    }
  });

  if (done) return <div className="space-y-4"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{t("passwordResetSuccess")}</div><Link href="/login" className="text-sm font-medium hover:underline">{t("backToLogin")}</Link></div>;

  if (identifier) {
    const resend = async () => {
      setError(null);
      setResent(false);
      try {
        // A new reset code is issued by asking for the reset again; the previous code is replaced.
        await requestPasswordReset({email: identifier});
        setResent(true);
      } catch (cause) {
        setError(cause);
      }
    };
    return <form className="space-y-5" onSubmit={(event: FormEvent) => void submitReset(event)} noValidate>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{t("resetOtpSent", {identifier})}</div>
      <div className="space-y-2"><Label htmlFor="otp">{t("otp")}</Label><Input id="otp" inputMode="numeric" maxLength={6} {...resetForm.register("otp")} aria-invalid={Boolean(resetForm.formState.errors.otp)} />{resetForm.formState.errors.otp ? <p className="text-xs text-destructive">{common("validation")}</p> : null}</div>
      <div className="space-y-2"><Label htmlFor="new-password">{t("newPassword")}</Label><Input id="new-password" type="password" autoComplete="new-password" {...resetForm.register("newPassword")} aria-invalid={Boolean(resetForm.formState.errors.newPassword)} /><p className={`text-xs ${resetForm.formState.errors.newPassword ? "text-destructive" : "text-muted-foreground"}`}>{t("passwordHint")}</p></div>
      <div className="space-y-2"><Label htmlFor="confirm-password">{t("confirmPassword")}</Label><Input id="confirm-password" type="password" autoComplete="new-password" {...resetForm.register("confirmPassword")} aria-invalid={Boolean(resetForm.formState.errors.confirmPassword)} />{resetForm.formState.errors.confirmPassword ? <p className="text-xs text-destructive">{t("passwordMismatch")}</p> : null}</div>
      {error ? <ErrorMessage error={error} /> : null}
      {resent ? <p className="text-sm text-emerald-700">{t("otpResent")}</p> : null}
      <Button type="submit" className="w-full" disabled={resetForm.formState.isSubmitting}>{resetForm.formState.isSubmitting ? common("loading") : t("resetPassword")}</Button>
      <Button type="button" variant="outline" className="w-full" onClick={() => void resend()}>{t("resendOtp")}</Button>
    </form>;
  }

  return <form className="space-y-5" onSubmit={(event: FormEvent) => void submitRequest(event)} noValidate>
    <div className="space-y-2"><Label htmlFor="identifier">{t("email")}</Label><Input id="identifier" type="email" autoComplete="email" placeholder={t("identifierPlaceholder")} {...requestForm.register("identifier")} aria-invalid={Boolean(requestForm.formState.errors.identifier)} />{requestForm.formState.errors.identifier ? <p className="text-xs text-destructive">{common("validation")}</p> : null}</div>
    {error ? <ErrorMessage error={error} /> : null}
    <Button type="submit" className="w-full" disabled={requestForm.formState.isSubmitting}>{requestForm.formState.isSubmitting ? common("loading") : t("sendResetOtp")}</Button>
  </form>;
}
