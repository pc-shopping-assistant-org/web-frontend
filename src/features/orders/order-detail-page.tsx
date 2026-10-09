"use client";

import {ArrowLeft, Ban, Check, CircleCheck, CreditCard, KeyRound, PackageCheck, Truck, XCircle} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState, type FormEvent} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {OrderDetailPageSkeleton} from "@/components/ui/loading-skeletons";
import {Label} from "@/components/ui/label";
import {StatusBadge} from "@/components/ui/status-badge";
import {Textarea} from "@/components/ui/textarea";
import {Link} from "@/i18n/navigation";
import {ApiClientError} from "@/lib/api/envelope";
import {isStaffRole} from "@/lib/auth/roles";
import {formatMoney} from "@/lib/format";
import {OrderStatus, PaymentMethodCode, PaymentStatus} from "@/lib/domain/commerce-enums";

import {useProfile} from "@/features/auth/queries";
import {useReviewedOrderItems} from "@/features/catalog/queries";
import {OrderLineReview} from "./order-line-review";
import {VnpayPayButton} from "./vnpay-pay";
import {useCancelOrder, useOrder, usePaymentMethods, useShippingMethods} from "./queries";

export function OrderDetailPage({orderId}: {orderId: string}) {
  const t = useTranslations("orders");
  const nav = useTranslations("nav");
  const common = useTranslations("common");
  const locale = useLocale();
  const profile = useProfile();
  const isStaff = isStaffRole(profile.data?.role);
  const requiresLogin = profile.isError && profile.error instanceof ApiClientError && profile.error.status === 401;
  const canLoad = Boolean(profile.data) && !isStaff;
  const query = useOrder(orderId, canLoad);
  const paymentMethods = usePaymentMethods(canLoad);
  const shippingMethods = useShippingMethods(canLoad);
  const cancel = useCancelOrder();
  const completedItems = query.data?.status === OrderStatus.Completed ? query.data.items : [];
  const reviewedItems = useReviewedOrderItems(completedItems.map((item) => item.id));
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("");
  if (profile.isPending) return <OrderDetailPageSkeleton />;
  if (profile.isError && !requiresLogin) return <section className="page-wrap py-16"><ErrorMessage error={profile.error} /></section>;
  if (requiresLogin) return <section className="page-wrap py-16"><Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center p-12 text-center"><KeyRound className="size-10 text-primary" /><h1 className="mt-4 text-2xl font-semibold">{nav("login")}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("loginRequired")}</p><Link href={`/login?redirect=${encodeURIComponent(`/orders/${orderId}`)}`} className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">{nav("login")}</Link></CardContent></Card></section>;
  if (isStaff) return <section className="page-wrap py-16"><Card className="border-primary/20 bg-primary/[0.03]"><CardContent className="flex flex-col items-center justify-center p-12 text-center"><KeyRound className="size-10 text-primary" /><h1 className="mt-4 text-2xl font-semibold">{t("staffTitle")}</h1><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t("staffDescription")}</p><Link href="/admin/orders" className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">{t("openAdminOrders")}</Link></CardContent></Card></section>;
  if (query.isPending) return <OrderDetailPageSkeleton />;
  if (query.isError || !query.data) {
    const notFound = query.error instanceof ApiClientError && query.error.status === 404;
    return <section className="page-wrap py-16"><Link href="/orders" className="mb-6 inline-flex items-center gap-2 text-sm hover:underline"><ArrowLeft className="size-4" />{t("backToOrders")}</Link>{notFound ? <div className="rounded-2xl border border-dashed p-12 text-center"><h1 className="text-2xl font-semibold">{t("notFound")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("notFoundDescription")}</p></div> : <ErrorMessage error={query.error} />}</section>;
  }
  const order = query.data;
  const canCancel = order.status === OrderStatus.PendingPayment || order.status === OrderStatus.PendingConfirmation;
  const paymentMethodName = (id?: string) => paymentMethods.data?.find((method) => method.id === id)?.name ?? "—";
  const payablePayment = order.status === OrderStatus.PendingPayment
    ? order.payments.find((payment) => payment.status === PaymentStatus.Pending
      && paymentMethods.data?.find((method) => method.id === payment.paymentMethodId)?.code === PaymentMethodCode.Vnpay)
    : undefined;
  const shippingMethod = shippingMethods.data?.find((method) => method.id === order.shippingMethodId);
  async function submitCancel(event: FormEvent) {
    event.preventDefault();
    try {
      await cancel.mutateAsync({orderId, reason: reason.trim() || undefined});
      setShowCancel(false);
      setReason("");
    } catch {
      // the failed mutation shows its own error inside the dialog
    }
  }
  return <section className="page-wrap py-12 sm:py-16">
    <Link href="/orders" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{t("backToOrders")}</Link>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow">{t("orderNumber")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{order.invoiceNumber}</h1><p className="mt-2 text-sm text-muted-foreground">{order.createdAt ? new Date(order.createdAt).toLocaleString(locale === "vi" ? "vi-VN" : "en-US") : "—"}</p></div>
      <div className="flex items-center gap-3"><StatusBadge status={order.status} label={t(`status.${order.status}`, {default: order.status})} />{canCancel ? <Button variant="destructive" onClick={() => {cancel.reset(); setShowCancel(true);}}><Ban className="size-4" />{t("cancel")}</Button> : null}</div>
    </div>
    <OrderStatusTimeline status={order.status} />
    {order.status === OrderStatus.Cancelled && order.cancellationReason ? <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm"><span className="font-medium">{t("cancellationReason")}:</span> {order.cancellationReason}</p> : null}
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>{t("items")}</CardTitle></CardHeader><CardContent className="divide-y">{order.items.length === 0 ? <p className="text-sm text-muted-foreground">{t("noItems")}</p> : order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 py-4 first:pt-0 last:pb-0"><div className="min-w-0"><p className="font-medium">{item.productName}</p>{item.variantLabel ? <p className="text-sm text-foreground/80">{item.variantLabel}</p> : null}{item.sku ? <p className="text-xs text-muted-foreground">{item.sku}</p> : null}<p className="mt-1 text-sm text-muted-foreground">{item.quantity} × {formatMoney(item.unitPrice, locale)}</p>{order.status === OrderStatus.Completed ? <OrderLineReview orderItemId={item.id} productVariantId={item.productVariantId} reviewed={reviewedItems.isError ? false : reviewedItems.data?.some((reviewed) => reviewed.orderItemId === item.id)} /> : null}</div><div className="shrink-0 text-right">{item.discountAmount > 0 ? <p className="text-xs text-muted-foreground">{t("discount")}: − {formatMoney(item.discountAmount, locale)}</p> : null}<p className="text-sm font-semibold">{formatMoney(item.lineTotal, locale)}</p></div></div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>{t("paymentAttempts")}</CardTitle></CardHeader><CardContent className="space-y-3">{order.payments.length ? order.payments.map((payment) => <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{paymentMethodName(payment.paymentMethodId)}</span><span className="flex items-center gap-3"><span>{formatMoney(payment.amount, locale)}</span><StatusBadge status={payment.status} /></span></div>) : <p className="text-sm text-muted-foreground">{t("noPayments")}</p>}{payablePayment ? <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/[0.035] p-4"><p className="text-sm">{t("vnpayHint")}</p><VnpayPayButton paymentId={payablePayment.id} /></div> : order.status === OrderStatus.PendingPayment ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{t("awaitingPayment")}</p> : null}</CardContent></Card>
      </div>
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>{t("deliverySnapshot")}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p className="font-medium">{order.recipientName}</p><p>{order.recipientPhone}</p><p className="leading-6 text-muted-foreground">{order.deliveryAddress}</p><p className="pt-2 text-muted-foreground">{t("shippingMethod")}: {shippingMethod?.name ?? "—"}</p>{order.note ? <p className="text-muted-foreground">{t("note")}: {order.note}</p> : null}</CardContent></Card>
        <Card><CardHeader><CardTitle>{t("summary")}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Summary label={t("subtotal")} value={formatMoney(order.subtotalAmount, locale)} /><Summary label={t("discount")} value={`− ${formatMoney(order.discountAmount, locale)}`} /><Summary label={t("shippingFee")} value={formatMoney(order.shippingFee, locale)} /><div className="border-t pt-3"><Summary label={t("total")} value={formatMoney(order.totalAmount, locale)} strong /></div></CardContent></Card>
      </div>
    </div>
    {showCancel ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-6 shadow-xl" onSubmit={(event) => void submitCancel(event)}><h2 className="text-lg font-semibold">{t("cancelOrder")}</h2><p className="text-sm text-muted-foreground">{t("cancelOrderDescription")}</p><div className="space-y-2"><Label htmlFor="cancel-reason">{t("cancelReason")}</Label><Textarea id="cancel-reason" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} /></div>{cancel.isError ? <ErrorMessage error={cancel.error} /> : null}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCancel(false)}>{common("back")}</Button><Button type="submit" variant="destructive" disabled={cancel.isPending}>{t("confirmCancel")}</Button></div></form></div> : null}
  </section>;
}

const orderTimeline = [
  {status: OrderStatus.PendingPayment, icon: CreditCard},
  {status: OrderStatus.PendingConfirmation, icon: Check},
  {status: OrderStatus.Confirmed, icon: CircleCheck},
  {status: OrderStatus.Shipping, icon: Truck},
  {status: OrderStatus.Completed, icon: PackageCheck},
] as const;

function OrderStatusTimeline({status}: {status?: string}) {
  const t = useTranslations("orders");
  const cancelled = status === OrderStatus.Cancelled;
  const currentIndex = orderTimeline.findIndex((item) => item.status === status);
  return <Card className="overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="flex items-start gap-0">{cancelled ? <div className="flex min-w-0 flex-1 items-center gap-3 text-destructive"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10"><XCircle className="size-5" /></span><div><p className="text-sm font-semibold">{t(`status.${OrderStatus.Cancelled}`)}</p><p className="text-xs text-muted-foreground">{t("cancelledDescription")}</p></div></div> : orderTimeline.map(({status: step, icon: Icon}, index) => {const complete = currentIndex >= index; const current = currentIndex === index; return <div key={step} className="flex min-w-0 flex-1 items-start"><div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center"><span className={`flex size-9 items-center justify-center rounded-full border ${complete ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/50 text-muted-foreground"} ${current ? "ring-4 ring-primary/10" : ""}`}><Icon className="size-4" /></span><span className={`text-[11px] leading-4 sm:text-xs ${complete ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{t(`status.${step}`)}</span></div>{index < orderTimeline.length - 1 ? <span className={`mt-4 h-px flex-1 ${currentIndex > index ? "bg-primary" : "bg-border"}`} /> : null}</div>})}</div></CardContent></Card>;
}

function Summary({label, value, strong}: {label: string; value: string; strong?: boolean}) { return <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : ""}`}><span className="text-muted-foreground">{label}</span><span>{value}</span></div>; }
