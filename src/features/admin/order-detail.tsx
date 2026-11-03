"use client";

import {
  AlertCircle,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  Copy,
  CreditCard,
  FileText,
  MapPin,
  Package,
  Phone,
  Printer,
  Truck,
  User,
} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useMemo, useState} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {StatusBadge} from "@/components/ui/status-badge";
import {AdminOrderStatusControl} from "@/features/orders/admin-order-status";
import {useAdminOrder, usePaymentMethods, useShippingMethods} from "@/features/orders/queries";
import {Link} from "@/i18n/navigation";
import {OrderStatus} from "@/lib/domain/commerce-enums";
import {formatMoney} from "@/lib/format";
import {cn} from "@/lib/utils";

import {BackLink, Failure, Loading, SummaryLine} from "./detail-kit";

/**
 * Copy to clipboard button with inline check feedback
 */
function CopyButton({text, label}: {text?: string; label: string}) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("admin.orderSteps");
  if (!text) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`${t("copy")} ${label}`}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {copied ? <CheckCheck className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </button>
  );
}

/**
 * Clean Order Progress Stepper Bar
 */
function OrderProgressStepper({
  status,
  createdAt,
  deliveredAt,
  statusHistory,
  locale,
}: {
  status: string;
  createdAt?: string;
  deliveredAt?: string;
  statusHistory: readonly {toStatus: string; createdAt?: string}[];
  locale: string;
}) {
  const t = useTranslations("admin");
  const isCancelled = status === OrderStatus.Cancelled;

  const dateTime = (value?: string) =>
    value ? new Date(value).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {dateStyle: "short", timeStyle: "short"}) : undefined;

  const historyMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const h of statusHistory) {
      if (!map.has(h.toStatus)) {
        map.set(h.toStatus, h.createdAt);
      }
    }
    return map;
  }, [statusHistory]);

  const isConfirmed =
    historyMap.has(OrderStatus.Confirmed) ||
    status === OrderStatus.Confirmed ||
    status === OrderStatus.Shipping ||
    status === OrderStatus.Completed;

  const isShipping =
    historyMap.has(OrderStatus.Shipping) ||
    status === OrderStatus.Shipping ||
    status === OrderStatus.Completed;

  const isCompleted = status === OrderStatus.Completed;

  const steps = [
    {
      key: "placed",
      label: t("orderSteps.placed"),
      date: dateTime(createdAt),
      icon: Package,
      completed: true,
      current: status === OrderStatus.PendingPayment || status === OrderStatus.PendingConfirmation,
    },
    {
      key: "confirmed",
      label: t("orderSteps.confirmed"),
      date: dateTime(historyMap.get(OrderStatus.Confirmed)),
      icon: Check,
      completed: isConfirmed,
      current: status === OrderStatus.Confirmed,
    },
    {
      key: "shipping",
      label: t("orderSteps.shipping"),
      date: dateTime(historyMap.get(OrderStatus.Shipping)),
      icon: Truck,
      completed: isShipping,
      current: status === OrderStatus.Shipping,
    },
    {
      key: "completed",
      label: t("orderSteps.completed"),
      date: dateTime(deliveredAt || historyMap.get(OrderStatus.Completed)),
      icon: CheckCircle2,
      completed: isCompleted,
      current: status === OrderStatus.Completed,
    },
  ];

  if (isCancelled) {
    return null;
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="relative flex items-start gap-3 md:flex-col md:items-center md:text-center">
              {/* Connecting line between steps */}
              {idx > 0 ? (
                <div
                  className={cn(
                    "hidden md:block absolute top-4 -left-1/2 w-full h-[2px] -z-0 transition-colors",
                    step.completed ? "bg-primary" : "bg-muted-foreground/20",
                  )}
                  style={{left: "-50%", width: "100%"}}
                />
              ) : null}

              {/* Step indicator node */}
              <div
                className={cn(
                  "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all",
                  step.completed
                    ? "border-primary bg-primary text-primary-foreground"
                    : step.current
                      ? "border-primary bg-background text-primary ring-4 ring-primary/15"
                      : "border-border bg-muted/40 text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </div>

              {/* Step labels */}
              <div className="min-w-0">
                <p className={cn("text-sm font-medium", step.current || step.completed ? "text-foreground" : "text-muted-foreground")}>
                  {step.label}
                </p>
                {step.date ? <p className="mt-0.5 text-xs text-muted-foreground font-mono">{step.date}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * Streamlined Order Detail Page
 * - Single payment info combined into the Financial Summary card.
 * - Balanced 2-column layout: Left (Products & Timeline), Right (Delivery & Finance).
 */
export function AdminOrderDetailPage({orderId}: {orderId: string}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const order = useAdminOrder(orderId);
  const paymentMethods = usePaymentMethods();
  const shippingMethods = useShippingMethods();

  if (order.isPending) return <Loading />;
  if (order.isError || !order.data) {
    return (
      <div className="space-y-4">
        <BackLink href="/admin/orders">{t("back")}</BackLink>
        <Failure error={order.error} />
      </div>
    );
  }

  const item = order.data;
  const dateTime = (value?: string) =>
    value ? new Date(value).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {dateStyle: "short", timeStyle: "short"}) : "—";
  const statusLabel = (status: string) => (t.has(`statusValues.${status}`) ? t(`statusValues.${status}`) : status);

  const cancellation =
    item.status === OrderStatus.Cancelled
      ? item.statusHistory.findLast((change) => change.toStatus === OrderStatus.Cancelled)
      : undefined;

  const shippingMethod = shippingMethods.data?.find((method) => method.id === item.shippingMethodId);
  // In this store, orders have a single primary payment record
  const payment = item.payments[0];
  const paymentMethod = paymentMethods.data?.find((method) => method.id === payment?.paymentMethodId);

  return (
    <div className="space-y-6">
      {/* Top Navigation Back Link */}
      <div>
        <BackLink href="/admin/orders">{t("back")}</BackLink>
      </div>

      {/* Main Order Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{item.invoiceNumber}</h1>
            <StatusBadge status={item.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Calendar className="size-3.5 text-muted-foreground" />
              {dateTime(item.createdAt)}
            </span>
            {item.customerId ? (
              <span className="inline-flex items-center gap-1">
                <span>·</span>
                <span className="font-mono">{t("customerId")}: {item.customerId}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Action Controls & Invoice Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <AdminOrderStatusControl orderId={orderId} status={item.status} />

          {item.status === OrderStatus.Completed ? (
            <Link
              href={`/admin/invoices/${orderId}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
            >
              <FileText className="size-3.5" />
              <span>{t("viewInvoice")}</span>
            </Link>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 gap-1.5 px-3 text-xs"
          >
            <Printer className="size-3.5" />
            <span>{t("printInvoice")}</span>
          </Button>
        </div>
      </div>

      {/* Cancellation Notice Banner */}
      {cancellation ? (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
          <div>
            <p className="font-semibold">{t("cancelOrder")}</p>
            <p className="mt-1 text-destructive/90">
              <span className="font-medium">{t("cancellationReason")}:</span> {cancellation.reason ?? "—"}
            </p>
            {cancellation.createdAt ? (
              <p className="mt-1 text-xs opacity-75 font-mono">{dateTime(cancellation.createdAt)}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Order Progress Stepper */}
      <OrderProgressStepper
        status={item.status}
        createdAt={item.createdAt}
        deliveredAt={item.deliveredAt}
        statusHistory={item.statusHistory}
        locale={locale}
      />

      {/* Balanced Two-Column Responsive Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Left Column (Main): Items & Status Change Timeline */}
        <div className="space-y-6">
          {/* Card: Order Items List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base sm:text-lg">{t("items")}</CardTitle>
              <span className="text-xs text-muted-foreground">{item.items.length} {t("items").toLowerCase()}</span>
            </CardHeader>
            <CardContent className="divide-y p-6 pt-0">
              {item.items.length ? (
                item.items.map((line) => (
                  <div key={line.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Product Placeholder Icon */}
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/30 text-muted-foreground">
                        <Package className="size-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm">{line.productName}</p>
                        {line.variantLabel ? (
                          <span className="mt-1 inline-block rounded bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                            {line.variantLabel}
                          </span>
                        ) : null}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {line.sku ? <span className="font-mono">SKU: {line.sku}</span> : null}
                          <span>
                            {line.quantity} × {formatMoney(line.unitPrice, locale)}
                          </span>
                        </div>
                        {line.discountAmount > 0 ? (
                          <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {t("discount")}: − {formatMoney(line.discountAmount, locale)}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="shrink-0 text-right">
                      <span className="block text-sm font-semibold text-foreground">
                        {formatMoney(line.lineTotal, locale)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("noItems")}</p>
              )}
            </CardContent>
          </Card>

          {/* Card: Status Change Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base sm:text-lg">{t("statusHistory")}</CardTitle>
              <span className="text-xs text-muted-foreground font-mono">
                {item.statusHistory.length} {t("statusHistory").toLowerCase()}
              </span>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {item.statusHistory.length ? (
                <ol className="relative space-y-4 border-l border-border/70 ml-2 pl-4">
                  {[...item.statusHistory].reverse().map((change, index) => (
                    <li key={`${change.toStatus}-${change.createdAt}-${index}`} className="relative text-sm">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
                      <p className="font-medium text-foreground">
                        {change.fromStatus ? `${statusLabel(change.fromStatus)} → ` : ""}
                        {statusLabel(change.toStatus)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground font-mono">{dateTime(change.createdAt)}</p>
                      {change.reason ? (
                        <p className="mt-1 rounded bg-muted/40 p-2 text-xs text-muted-foreground">
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

        {/* Right Column (Sidebar): Delivery & Unified Finance/Payment */}
        <div className="space-y-6">
          {/* Card: Customer & Delivery Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">{t("deliverySnapshot")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-sm p-6 pt-0">
              {/* Recipient Name */}
              <div className="flex items-start gap-2.5">
                <User className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{item.recipientName ?? t("guestCustomer")}</p>
                </div>
              </div>

              {/* Recipient Phone */}
              {item.recipientPhone ? (
                <div className="flex items-center justify-between gap-2 border-t pt-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Phone className="size-4 shrink-0 text-muted-foreground" />
                    <span className="font-mono text-foreground">{item.recipientPhone}</span>
                  </div>
                  <CopyButton text={item.recipientPhone} label={t("recipientPhone")} />
                </div>
              ) : null}

              {/* Delivery Address */}
              {item.deliveryAddress ? (
                <div className="flex items-start justify-between gap-2 border-t pt-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <MapPin className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                    <p className="leading-relaxed text-muted-foreground">{item.deliveryAddress}</p>
                  </div>
                  <CopyButton text={item.deliveryAddress} label={t("address")} />
                </div>
              ) : null}

              {/* Shipping Method & Fee */}
              <div className="border-t pt-3 text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>{t("shippingMethod")}:</span>
                  <span className="font-medium text-foreground">{shippingMethod?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("shippingFee")}:</span>
                  <span className="font-medium text-foreground">{formatMoney(item.shippingFee, locale)}</span>
                </div>
              </div>

              {/* Customer Note Callout */}
              {item.note ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-semibold">{t("note")}:</span> {item.note}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Card: Unified Payment & Financial Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-sm p-6 pt-0">
              {/* Payment Info Tile */}
              {payment ? (
                <div className="rounded-xl border bg-muted/20 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground inline-flex items-center gap-1.5">
                      <CreditCard className="size-3.5 text-primary" />
                      {paymentMethod?.name ?? t("resource.payments")}
                    </span>
                    <StatusBadge status={payment.status} />
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/50">
                    <span>{payment.paidAt ? t("paidAt") : t("orderDetail")}:</span>
                    <span className="font-mono">{payment.paidAt ? dateTime(payment.paidAt) : dateTime(payment.createdAt)}</span>
                  </div>
                </div>
              ) : null}

              {/* Price Breakdown */}
              <div className="space-y-2.5 pt-1">
                <SummaryLine label={t("subtotal")} value={formatMoney(item.subtotalAmount, locale)} />
                {item.discountAmount > 0 ? (
                  <SummaryLine
                    label={t("discount")}
                    value={`− ${formatMoney(item.discountAmount, locale)}`}
                  />
                ) : null}
                <SummaryLine label={t("shippingFee")} value={formatMoney(item.shippingFee, locale)} />
              </div>

              {/* Final Total Amount */}
              <div className="border-t pt-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-semibold text-foreground">{t("total")}</span>
                  <span className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    {formatMoney(item.totalAmount, locale)}
                  </span>
                </div>
              </div>

              {item.deliveredAt ? (
                <p className="border-t pt-2.5 text-xs text-muted-foreground font-mono">
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
