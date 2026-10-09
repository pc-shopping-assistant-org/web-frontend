"use client";

import {CreditCard} from "lucide-react";
import {useTranslations} from "next-intl";
import {useEffect, useRef} from "react";
import {useQuery} from "@tanstack/react-query";

import {Button} from "@/components/ui/button";
import {ErrorMessage} from "@/components/ui/error-message";

import {getOrder} from "./api";
import {orderKeys, useCreateVnpayUrl} from "./queries";

/** Opens the VNPAY page for a payment: the browser leaves the storefront and comes back to the return page. */
export function VnpayPayButton({paymentId, label}: {paymentId: string; label?: string}) {
  const t = useTranslations("orders");
  const common = useTranslations("common");
  const pay = useCreateVnpayUrl();

  async function start() {
    try {
      window.location.assign(await pay.mutateAsync(paymentId));
    } catch {
      // the failed mutation shows its own error below
    }
  }

  return <div className="space-y-3">
    <Button type="button" onClick={() => void start()} disabled={pay.isPending || pay.isSuccess}>
      <CreditCard className="size-4" />
      {pay.isPending || pay.isSuccess ? common("loading") : label ?? t("payWithVnpay")}
    </Button>
    {pay.isError ? <ErrorMessage error={pay.error} /> : null}
  </div>;
}

/**
 * Right after an online order is placed its payment is opened a moment later by the backend. This waits for it, then
 * sends the customer to VNPAY on its own; the button stays as the way to try again.
 */
export function VnpayAutoRedirect({orderId}: {orderId: string}) {
  const t = useTranslations("checkout");
  const pay = useCreateVnpayUrl();
  const started = useRef(false);
  const order = useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrder(orderId),
    refetchInterval: (query) => (query.state.data?.payments.length ? false : 1500),
  });
  const paymentId = order.data?.payments.find((payment) => payment.status === "PENDING")?.id;

  useEffect(() => {
    if (!paymentId || started.current) return;
    started.current = true;
    pay.mutateAsync(paymentId).then((url) => window.location.assign(url), () => {
      // the error is shown below, with the button to try again
    });
  }, [paymentId, pay]);

  return <div className="space-y-3 rounded-xl border bg-muted/40 p-4 text-sm">
    {pay.isError ? <>
      <p className="text-amber-900">{t("vnpayFailed")}</p>
      {paymentId ? <VnpayPayButton paymentId={paymentId} label={t("payWithVnpay")} /> : null}
    </> : <p className="font-medium">{paymentId ? t("vnpayRedirecting") : t("vnpayPreparing")}</p>}
  </div>;
}
