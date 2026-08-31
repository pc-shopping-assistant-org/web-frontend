import type {Metadata} from "next";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

export const metadata: Metadata = {title: "Account"};

export default function AccountPage() {
  const t = useTranslations("account");
  return <section className="page-wrap py-12 sm:py-16"><div className="mb-10 space-y-3"><p className="eyebrow">{t("profile")}</p><h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1><p className="text-muted-foreground">{t("description")}</p></div><div className="grid gap-5 md:grid-cols-3"><AccountCard title={t("profile")} /><AccountCard title={t("addresses")} /><AccountCard title={t("orders")} /></div><p className="mt-8 text-sm text-muted-foreground">{t("comingSoon")}</p></section>;
}

function AccountCard({title}: {title: string}) { return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><div className="h-2 w-20 rounded-full bg-muted" /></CardContent></Card>; }
