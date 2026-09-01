import type {Metadata} from "next";
import {ArrowLeft} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {Link} from "@/i18n/navigation";
import {LoginFormClient} from "../auth-route-client";

export const metadata: Metadata = {title: "Sign in"};

export default async function LoginPage({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) {
  const t = await getTranslations("auth");
  const params = await searchParams;
  const redirectTo = typeof params.redirect === "string" && params.redirect.startsWith("/") ? params.redirect : undefined;
  return <section className="page-wrap grid max-w-6xl gap-12 py-16 lg:grid-cols-[1fr_30rem] lg:py-24"><div className="space-y-6"><Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Home</Link><p className="eyebrow">{t("login")}</p><h1 className="text-5xl font-semibold tracking-tight">{t("loginTitle")}</h1><p className="max-w-md text-lg leading-8 text-muted-foreground">{t("loginDescription")}</p></div><div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8"><LoginFormClient redirectTo={redirectTo} /><p className="mt-6 text-center text-sm text-muted-foreground">{t("noAccount")} <Link href="/register" className="font-medium text-foreground hover:underline">{t("register")}</Link></p></div></section>;
}
