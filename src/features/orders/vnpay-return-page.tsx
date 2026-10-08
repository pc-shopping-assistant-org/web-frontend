"use client";

import {CheckCircle2, CircleAlert, Clock3} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useSearchParams} from "next/navigation";

import {Card, CardContent} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Link} from "@/i18n/navigation";
import {formatMoney} from "@/lib/format";

import {useVnpayResult} from "./queries";

/** The page VNPAY sends the customer back to: it asks the backend, which checks the signature, what became of the payment. */
export function VnpayReturnPage() {
  const t = useTranslations("vnpayReturn");
  const locale = useLocale();
  const query = useVnpayResult(useSearchParams().toString());

  if (query.isPending) {
    return <section className="page-wrap max-w-2xl py-16"><p className="text-center text-muted-foreground">{t("checking")}</p></section>;
  }
  if (query.isError) {
    return <section className="page-wrap max-w-2xl space-y-4 py-16"><h1 className="text-2xl font-semibold">{t("errorTitle")}</h1><ErrorMessage error={query.error} /><Link href="/orders" className="inline-flex text-sm font-medium text-primary hover:underline">{t("viewOrder")}</Link></section>;
  }

  const {result, orderId, amount} = query.data;
  const view = {
    PAID: {icon: CheckCircle2, tone: "text-emerald-600", title: t("paidTitle"), description: t("paidDescription")},
    FAILED: {icon: CircleAlert, tone: "text-destructive", title: t("failedTitle"), description: t("failedDescription")},
    CANCELLED: {icon: Clock3, tone: "text-amber-600", title: t("cancelledTitle"), description: t("cancelledDescription")},
    PENDING: {icon: Clock3, tone: "text-amber-600", title: t("cancelledTitle"), description: t("cancelledDescription")},
  }[result];
  const Icon = view.icon;
  return <section className="page-wrap max-w-2xl py-16">
    <Card>
      <CardContent className="space-y-5 p-8 text-center">
        <Icon className={`mx-auto size-12 ${view.tone}`} />
        <h1 className="text-3xl font-semibold">{view.title}</h1>
        <p className="text-muted-foreground">{view.description}</p>
        <p className="text-sm"><span className="text-muted-foreground">{t("amount")}: </span><span className="font-semibold">{formatMoney(amount, locale)}</span></p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={`/orders/${orderId}`} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">{t("viewOrder")}</Link>
          <Link href="/products" className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted">{t("continueShopping")}</Link>
        </div>
      </CardContent>
    </Card>
  </section>;
}
