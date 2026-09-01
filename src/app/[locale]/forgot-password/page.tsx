import type {Metadata} from "next";
import {useTranslations} from "next-intl";

import {Link} from "@/i18n/navigation";
import {PasswordRecoveryFormClient} from "../auth-route-client";

export const metadata: Metadata = {title: "Password recovery"};

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  return <section className="page-wrap grid max-w-6xl gap-12 py-16 lg:grid-cols-[1fr_30rem] lg:py-24"><div className="space-y-6"><p className="eyebrow">{t("passwordRecovery")}</p><h1 className="text-5xl font-semibold tracking-tight">{t("forgotPassword")}</h1><p className="max-w-md text-lg leading-8 text-muted-foreground">{t("passwordRecoveryDescription")}</p><Link href="/login" className="text-sm font-medium hover:underline">{t("backToLogin")}</Link></div><div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8"><PasswordRecoveryFormClient /></div></section>;
}
