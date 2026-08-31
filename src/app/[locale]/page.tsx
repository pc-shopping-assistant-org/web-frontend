import {ArrowRight, Bot, CheckCircle2, CircleDollarSign, ShieldCheck} from "lucide-react";
import {useTranslations} from "next-intl";

import {Link} from "@/i18n/navigation";
import {FeaturedProducts} from "@/features/catalog/components/featured-products";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <>
      <section className="border-b bg-[radial-gradient(circle_at_80%_10%,theme(colors.primary/12),transparent_35%),linear-gradient(180deg,theme(colors.muted/40),transparent)]">
        <div className="page-wrap grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-3xl space-y-7">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="text-5xl font-semibold tracking-[-0.04em] sm:text-7xl">{t("title")}</h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{t("description")}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/85">{t("browseProducts")}<ArrowRight className="size-4" /></Link>
              <button type="button" disabled className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium opacity-60"><Bot className="size-4" />{t("talkToAssistant")}</button>
            </div>
          </div>
          <div className="relative min-h-72 overflow-hidden rounded-3xl border bg-background/80 p-6 shadow-xl shadow-primary/5">
            <div className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-10">
              <div className="flex items-center justify-between"><span className="rounded-full border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wider">Catalog live</span><span className="size-3 rounded-full bg-emerald-500 shadow-[0_0_0_6px_theme(colors.emerald.500/15)]" /></div>
              <div className="grid grid-cols-3 gap-3">
                {["CPU", "GPU", "RAM"].map((label, index) => <div key={label} className="rounded-2xl border bg-muted/50 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-8 text-2xl font-semibold">0{index + 1}</p></div>)}
              </div>
              <p className="text-sm text-muted-foreground">{t("catalogDescription")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-wrap py-16 sm:py-20">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">{t("catalogTitle")}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{t("catalogTitle")}</h2></div><Link href="/products" className="text-sm font-medium hover:underline">{t("browseProducts")} <ArrowRight className="inline size-4" /></Link></div>
        <FeaturedProducts />
      </section>

      <section className="border-y bg-muted/25">
        <div className="page-wrap py-16 sm:py-20"><p className="eyebrow">{t("whyTitle")}</p><h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">{t("whyTitle")}</h2><div className="mt-10 grid gap-4 md:grid-cols-3"><ValueCard icon={CheckCircle2} title={t("whyCatalog")} description={t("whyCatalogDescription")} /><ValueCard icon={CircleDollarSign} title={t("whyPrices")} description={t("whyPricesDescription")} /><ValueCard icon={ShieldCheck} title={t("whySupport")} description={t("whySupportDescription")} /></div></div>
      </section>
    </>
  );
}

function ValueCard({icon: Icon, title, description}: {icon: typeof CheckCircle2; title: string; description: string}) {
  return <div className="rounded-2xl border bg-background p-6"><Icon className="size-5 text-primary" /><h3 className="mt-6 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>;
}
