"use client";

import {useLocale, useTranslations} from "next-intl";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {StatusBadge} from "@/components/ui/status-badge";
import {Link} from "@/i18n/navigation";
import {formatMoney} from "@/lib/format";
import {OrderStatus} from "@/lib/domain/commerce-enums";
import {AdminOrderStatusControl} from "@/features/orders/admin-order-status";
import {useAdminOrder, usePaymentMethods, useShippingMethods} from "@/features/orders/queries";
import {BackLink, Loading, Failure, SummaryLine} from "./detail-kit";

export function AdminOrderDetailPage({orderId}: {orderId: string}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const order = useAdminOrder(orderId);
  const paymentMethods = usePaymentMethods();
  const shippingMethods = useShippingMethods();
  if (order.isPending) return <Loading />;
  if (order.isError || !order.data)
    return (
      <>
        <BackLink href="/admin/orders">{t("back")}</BackLink>
        <Failure error={order.error} />
      </>
    );
  const item = order.data;
  const dateTime = (value?: string) => (value ? new Date(value).toLocaleString(locale === "vi" ? "vi-VN" : "en-US") : "—");
  const statusLabel = (status: string) => (t.has(`statusValues.${status}`) ? t(`statusValues.${status}`) : status);
  const cancellation =
    item.status === OrderStatus.Cancelled ? item.statusHistory.findLast((change) => change.toStatus === OrderStatus.Cancelled) : undefined;
  const shippingMethod = shippingMethods.data?.find((method) => method.id === item.shippingMethodId);
  return (
    <div>
      <BackLink href="/admin/orders">{t("back")}</BackLink>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("orderDetail")}</p>
          <h1 className="mt-2 text-3xl font-semibold">{item.invoiceNumber}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {dateTime(item.createdAt)}
            {item.customerId ? ` · ${t("customerId")}: ${item.customerId}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={item.status} />
          <AdminOrderStatusControl orderId={orderId} status={item.status} className="w-52" />
          {item.status === OrderStatus.Completed ? (
            <Link
              href={`/admin/invoices/${orderId}`}
              className="inline-flex h-9 items-center rounded-lg border bg-background px-3 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
            >
              {t("viewInvoice")}
            </Link>
          ) : null}
        </div>
      </div>
      {cancellation ? (
        <p className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <span className="font-medium">{t("cancellationReason")}:</span> {cancellation.reason ?? "—"}
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("items")}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {item.items.length ? (
                item.items.map((line) => (
                  <div key={line.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium">{line.productName}</p>
                      {line.variantLabel ? <p className="text-sm text-muted-foreground">{line.variantLabel}</p> : null}
                      <p className="text-sm text-muted-foreground">
                        {line.sku ? `${line.sku} · ` : ""}
                        {line.quantity} × {formatMoney(line.unitPrice, locale)}
                      </p>
                      {line.discountAmount > 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("itemDiscount")}: − {formatMoney(line.discountAmount, locale)}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-right font-semibold">
                      <span className="block text-xs font-normal text-muted-foreground">{t("itemNet")}</span>
                      {formatMoney(line.lineTotal, locale)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("noItems")}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("paymentAttempts")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.payments.length ? (
                item.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/10 p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {paymentMethods.data?.find((method) => method.id === payment.paymentMethodId)?.name ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {payment.paidAt ? `${t("paidAt")}: ${dateTime(payment.paidAt)}` : dateTime(payment.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatMoney(payment.amount, locale)}</span>
                      <StatusBadge status={payment.status} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("noPayments")}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("statusHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              {item.statusHistory.length ? (
                <ol className="space-y-4 border-l pl-4">
                  {[...item.statusHistory].reverse().map((change, index) => (
                    <li key={`${change.toStatus}-${change.createdAt}-${index}`} className="text-sm">
                      <p className="font-medium">
                        {change.fromStatus ? `${statusLabel(change.fromStatus)} → ` : ""}
                        {statusLabel(change.toStatus)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dateTime(change.createdAt)} · {change.changedBy ? t("changedByStaff") : t("changedBySystem")}
                      </p>
                      {change.reason ? (
                        <p className="mt-1 text-muted-foreground">
                          {t("reason")}: {change.reason}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">{t("noStatusHistory")}</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("deliverySnapshot")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{item.recipientName}</p>
              <p>{item.recipientPhone}</p>
              <p className="leading-6 text-muted-foreground">{item.deliveryAddress}</p>
              <div className="border-t pt-3 text-sm text-muted-foreground">
                <p>
                  {t("shippingMethod")}: {shippingMethod?.name ?? "—"}
                </p>
                <p className="mt-1">
                  {t("shippingFee")}: {formatMoney(item.shippingFee, locale)}
                </p>
              </div>
              {item.note ? (
                <p className="border-t pt-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t("note")}:</span> {item.note}
                </p>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryLine label={t("subtotal")} value={formatMoney(item.subtotalAmount, locale)} />
              <SummaryLine label={t("discount")} value={`− ${formatMoney(item.discountAmount, locale)}`} />
              <SummaryLine label={t("shippingFee")} value={formatMoney(item.shippingFee, locale)} />
              <div className="border-t pt-3">
                <SummaryLine label={t("total")} value={formatMoney(item.totalAmount, locale)} strong />
              </div>
              {item.deliveredAt ? (
                <p className="border-t pt-3 text-xs text-muted-foreground">
                  {t("deliveredAt")}: {dateTime(item.deliveredAt)}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
