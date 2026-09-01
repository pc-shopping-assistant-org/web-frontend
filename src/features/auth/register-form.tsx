"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "@/i18n/navigation";
import {useTranslations} from "next-intl";
import {useForm} from "react-hook-form";
import {useState, type FormEvent} from "react";
import type {UseFormRegisterReturn} from "react-hook-form";
import {z} from "zod";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input as InputPrimitive} from "@/components/ui/input";

import {register, resendOtp, verifyRegistrationOtp} from "./api";
import {registerRequestSchema} from "@/features/auth/contracts/requests";
import {AuthUiMessage, Gender, OtpPurpose} from "@/lib/domain/account-enums";

type RegisterFormValues = z.input<typeof registerRequestSchema>;

export function RegisterForm() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const router = useRouter();
  const [pending, setPending] = useState<RegisterFormValues | null>(null);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const form = useForm<RegisterFormValues>({resolver: zodResolver(registerRequestSchema), defaultValues: {fullName: "", email: "", phone: "", password: "", address: "", gender: "", birthday: ""}});
  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const payload = registerRequestSchema.parse(values);
      await register(payload);
      setPending(values);
      setMessage(AuthUiMessage.OTP_SENT);
    } catch (error) {
      setError(error);
    }
  });
  if (pending) {
    const verify = async (event: FormEvent) => {
      event.preventDefault();
      setMessage(null);
      setError(null);
      try {
        await verifyRegistrationOtp({email: pending.email, otp});
        router.push("/account");
        router.refresh();
      } catch (error) {
        setError(error);
      }
    };
    const resend = async () => {
      try {
        await resendOtp({email: pending.email, purpose: OtpPurpose.Registration});
        setError(null);
        setMessage(AuthUiMessage.OTP_SENT);
      } catch (error) {
        setError(error);
      }
    };
    return <form className="space-y-5" onSubmit={(event) => void verify(event)} noValidate>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{t("otpSent", {email: pending.email})}</div>
      <div className="space-y-2"><Label htmlFor="registration-otp">{t("otp")}</Label><InputPrimitive id="registration-otp" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} /></div>
      {error ? <ErrorMessage error={error} /> : null}
      {message === AuthUiMessage.OTP_SENT ? <p className="text-sm text-emerald-700">{t("otpResent")}</p> : null}
      <Button type="submit" className="w-full" disabled={otp.length !== 6}>{t("verifyOtp")}</Button>
      <Button type="button" variant="outline" className="w-full" onClick={() => void resend()}>{t("resendOtp")}</Button>
    </form>;
  }

  return <form className="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
    <Field id="fullName" label={t("fullName")} register={form.register("fullName")} error={form.formState.errors.fullName != null} errorMessage={common("validation")} />
    <Field id="email" type="email" label={t("email")} register={form.register("email")} error={form.formState.errors.email != null} errorMessage={common("validation")} />
    <Field id="phone" label={t("phone")} register={form.register("phone")} error={form.formState.errors.phone != null} errorMessage={common("validation")} />
    <Field id="password" type="password" label={t("password")} register={form.register("password")} error={form.formState.errors.password != null} errorMessage={common("validation")} />
    <Field id="address" label={t("address")} register={form.register("address")} error={form.formState.errors.address != null} errorMessage={common("validation")} />
    <div className="grid gap-4 sm:grid-cols-2"><Field id="birthday" type="date" label={t("birthday")} register={form.register("birthday")} errorMessage={common("validation")} /><div className="space-y-2"><Label htmlFor="gender">{t("gender")}</Label><select id="gender" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" {...form.register("gender")}><option value="">—</option><option value={Gender.Male}>{t("male")}</option><option value={Gender.Female}>{t("female")}</option><option value={Gender.Other}>{t("other")}</option></select></div></div>
    {error ? <ErrorMessage error={error} /> : null}
    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? common("loading") : t("register")}</Button>
  </form>;
}

function Field({id, label, type = "text", register, error, errorMessage}: {id: string; label: string; type?: string; register: UseFormRegisterReturn; error?: boolean; errorMessage?: string}) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} {...register} aria-invalid={error} />{error ? <p className="text-xs text-destructive">{errorMessage}</p> : null}</div>;
}
