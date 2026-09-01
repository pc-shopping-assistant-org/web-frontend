import {IconCircleCheck, IconCoin, IconShieldCheck} from "@tabler/icons-react";
import type {TablerIcon} from "@tabler/icons-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import {HomeStorefront} from "@/features/home/home-storefront";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <>
      <HomeStorefront />

      <section className="border-y bg-muted/25" aria-labelledby="why-title">
        <div className="storefront-wrap py-14 sm:py-20">
          <div className="flex max-w-3xl flex-col gap-3">
            <p className="eyebrow">{t("whyEyebrow")}</p>
            <h2 id="why-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("whyTitle")}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{t("whyDescription")}</p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            <ValueCard icon={IconCircleCheck} title={t("whyCatalog")} description={t("whyCatalogDescription")} />
            <ValueCard icon={IconCoin} title={t("whyPrices")} description={t("whyPricesDescription")} />
            <ValueCard icon={IconShieldCheck} title={t("whySupport")} description={t("whySupportDescription")} />
          </div>
        </div>
      </section>
    </>
  );
}

function ValueCard({icon: Icon, title, description}: {icon: TablerIcon; title: string; description: string}) {
  return (
    <Card className="border-border/70 bg-background/80 shadow-none">
      <CardContent className="p-6">
        <Icon className="size-5 text-primary" aria-hidden="true" />
        <h3 className="mt-6 font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
