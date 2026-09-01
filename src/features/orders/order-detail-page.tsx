"use client";

import {ArrowLeft, Ban, Check, CircleCheck, CreditCard, KeyRound, PackageCheck, Star, Truck, XCircle} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import Image from "next/image";
import {useMemo, useState, type FormEvent} from "react";
import {CardElement, Elements, useElements, useStripe} from "@stripe/react-stripe-js";
import {loadStripe} from "@stripe/stripe-js";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Label} from "@/components/ui/label";
import {StatusBadge} from "@/components/ui/status-badge";
import {Textarea} from "@/components/ui/textarea";
import {Link} from "@/i18n/navigation";
import {ApiClientError} from "@/lib/api/envelope";
import {isStaffRole} from "@/lib/auth/roles";
import {formatMoney} from "@/lib/format";
import type {PaymentIntent} from "@/features/orders/contracts/responses";
import {CatalogCategoryIcon} from "@/features/catalog/components/catalog-category-icon";
import {ApiMessageKey} from "@/lib/domain/message-keys";
import {OrderStatus, PaymentStatus, ShippingMethodCode} from "@/lib/domain/commerce-enums";

import {useCreateProductReview} from "@/features/catalog/queries";
import {useProfile} from "@/features/auth/queries";
import {useCancelOrder, useCreatePaymentIntent, useOrder} from "./queries";

export function OrderDetailPage({orderId}: {orderId: string}) {
  const t = useTranslations("orders");
  const nav = useTranslations("nav");
  const common = useTranslations("common");
  const locale = useLocale();
  const profile = useProfile();
  const isStaff = isStaffRole(profile.data?.role);
  const requiresLogin = profile.isError && profile.error instanceof ApiClientError && profile.error.status === 401;
  const query = useOrder(orderId, Boolean(profile.data) && !isStaff);
  const cancel = useCancelOrder();
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("");
  if (profile.isPending) return <section className="page-wrap py-16"><div className="h-96 animate-pulse rounded-2xl bg-muted" /></section>;
  if (profile.isError && !requiresLogin) return <section className="page-wrap py-16"><ErrorMessage error={profile.error} /></section>;
  if (requiresLogin) return <section className="page-wrap py-16"><Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center p-12 text-center"><KeyRound className="size-10 text-primary" /><h1 className="mt-4 text-2xl font-semibold">{nav("login")}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("loginRequired")}</p><Link href={`/login?redirect=${encodeURIComponent(`/orders/${orderId}`)}`} className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">{nav("login")}</Link></CardContent></Card></section>;
  if (isStaff) return <section className="page-wrap py-16"><Card className="border-primary/20 bg-primary/[0.03]"><CardContent className="flex flex-col items-center justify-center p-12 text-center"><KeyRound className="size-10 text-primary" /><h1 className="mt-4 text-2xl font-semibold">{t("staffTitle")}</h1><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t("staffDescription")}</p><Link href="/admin/orders" className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">{t("openAdminOrders")}</Link></CardContent></Card></section>;
  if (query.isPending) return <section className="page-wrap py-16"><div className="h-96 animate-pulse rounded-2xl bg-muted" /></section>;
  if (query.isError || !query.data) return <section className="page-wrap py-16"><Link href="/orders" className="mb-6 inline-flex items-center gap-2 text-sm hover:underline"><ArrowLeft className="size-4" />{t("backToOrders")}</Link><ErrorMessage error={query.error ?? new Error(ApiMessageKey.UNKNOWN)} /></section>;
  const order = query.data;
  const canCancel = order.status === OrderStatus.PendingPayment || order.status === OrderStatus.PendingConfirmation;
  async function submitCancel(event: FormEvent) { event.preventDefault(); await cancel.mutateAsync({orderId, reason: reason.trim() || undefined}); setShowCancel(false); }
  const hasPaidAttempt = order.payments?.some((payment) => payment.status === PaymentStatus.Paid) ?? false;
  const canRetryPayment = order.status === OrderStatus.PendingPayment && !hasPaidAttempt;
  return <section className="page-wrap py-12 sm:py-16"><Link href="/orders" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{t("backToOrders")}</Link><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{t("orderNumber")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{order.id}</h1><p className="mt-2 text-sm text-muted-foreground">{order.orderTime ? new Date(order.orderTime).toLocaleString(locale === "vi" ? "vi-VN" : "en-US") : "—"}</p></div><div className="flex items-center gap-3"><StatusBadge status={order.status} label={order.status ? t(`status.${order.status}`, {default: order.status}) : undefined} />{canCancel ? <Button variant="destructive" onClick={() => setShowCancel(true)}><Ban className="size-4" />{t("cancel")}</Button> : null}</div></div><OrderStatusTimeline status={order.status} /><div className="mt-6">{cancel.isError ? <ErrorMessage error={cancel.error} /> : null}</div><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]"><div className="space-y-6"><Card><CardHeader><CardTitle>{t("items")}</CardTitle></CardHeader><CardContent className="divide-y">{order.items?.map((item, index) => <div key={item.id ?? index} className="flex gap-4 py-5 first:pt-0 last:pb-0"><div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/60">{item.imageUrl ? <Image src={item.imageUrl} alt={item.productName ?? ""} fill sizes="64px" unoptimized className="object-cover" /> : <CatalogCategoryIcon categoryName={item.productName ?? item.sku} className="size-8 text-primary/40" strokeWidth={1.45} />}</div><div className="min-w-0 flex-1"><p className="font-medium">{item.productName ?? item.sku}</p><p className="text-sm text-muted-foreground">{item.quantity} × {formatMoney(item.unitPrice, locale)}</p><p className="mt-1 text-sm font-semibold">{formatMoney(item.totalAmount, locale)}</p>{order.status === OrderStatus.Completed && item.id && item.productId ? <ReviewForm productId={item.productId} orderItemId={item.id} /> : null}</div></div>)}</CardContent></Card><Card><CardHeader><CardTitle>{t("paymentAttempts")}</CardTitle></CardHeader><CardContent className="space-y-3">{order.payments?.length ? order.payments.map((payment, index) => <div key={payment.id ?? index} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{payment.paymentMethodCode ?? "—"}</span><span className="flex items-center gap-3"><span>{formatMoney(payment.amount, locale)}</span><StatusBadge status={payment.status} /></span></div>) : <p className="text-sm text-muted-foreground">{t("noPayments")}</p>}</CardContent></Card>{canRetryPayment ? <RetryPayment orderId={orderId} onSubmitted={() => void query.refetch()} /> : null}</div><div className="space-y-6"><Card><CardHeader><CardTitle>{t("deliverySnapshot")}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p className="font-medium">{order.recipientName}</p><p>{order.recipientPhone}</p><p className="leading-6 text-muted-foreground">{order.deliveryAddress}</p><p className="pt-2 text-muted-foreground">{t("shippingMethod")}: {order.shippingMethodCode ?? ShippingMethodCode.Standard}</p></CardContent></Card><Card><CardHeader><CardTitle>{t("summary")}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Summary label={t("subtotal")} value={formatMoney(order.subtotalAmount, locale)} /><Summary label={t("discount")} value={`− ${formatMoney(order.discountAmount, locale)}`} /><Summary label={t("shippingFee")} value={formatMoney(order.shippingFee, locale)} /><div className="border-t pt-3"><Summary label={t("total")} value={formatMoney(order.totalAmount, locale)} strong /></div></CardContent></Card></div></div>{showCancel ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-6 shadow-xl" onSubmit={(event) => void submitCancel(event)}><h2 className="text-lg font-semibold">{t("cancelOrder")}</h2><div className="space-y-2"><Label htmlFor="cancel-reason">{t("cancelReason")}</Label><Textarea id="cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)} /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCancel(false)}>{common("back")}</Button><Button type="submit" variant="destructive" disabled={cancel.isPending}>{t("confirmCancel")}</Button></div></form></div> : null}</section>;
}

function RetryPayment({orderId, onSubmitted}: {orderId: string; onSubmitted: () => void}) {
  const t = useTranslations("orders");
  const checkout = useTranslations("checkout");
  const common = useTranslations("common");
  const createIntent = useCreatePaymentIntent();
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const stripePromise = useMemo(() => {
    const publishableKey = paymentIntent?.publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    return publishableKey ? loadStripe(publishableKey) : null;
  }, [paymentIntent]);

  async function preparePayment() {
    createIntent.reset();
    setPaymentSubmitted(false);
    try {
      setPaymentIntent(await createIntent.mutateAsync({orderId}));
    } catch {
      // React Query keeps the stable API error in createIntent.error for the
      // inline error panel; do not surface a rejected promise to the click
      // handler as an unhandled browser error.
    }
  }

  return <Card className="border-primary/20 bg-primary/[0.035]"><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="size-5 text-primary" />{t("retryPayment")}</CardTitle><p className="text-sm leading-6 text-muted-foreground">{t("retryPaymentDescription")}</p></CardHeader><CardContent>{!paymentIntent ? <Button type="button" onClick={() => void preparePayment()} disabled={createIntent.isPending}><CreditCard className="size-4" />{createIntent.isPending ? common("loading") : t("preparePayment")}</Button> : paymentSubmitted ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{checkout("paymentSubmitted")}</p> : stripePromise && paymentIntent.clientSecret ? <><p className="text-sm font-medium">{t("paymentAttemptReady")}</p><Elements stripe={stripePromise}><StripeCardForm clientSecret={paymentIntent.clientSecret} onSubmitted={() => {setPaymentSubmitted(true); onSubmitted();}} /></Elements></> : <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{checkout("stripeConfigurationMissing")}</p>}{createIntent.isError ? <div className="mt-3"><ErrorMessage error={createIntent.error} /></div> : null}</CardContent></Card>;
}

function StripeCardForm({clientSecret, onSubmitted}: {clientSecret: string; onSubmitted: () => void}) {
  const t = useTranslations("checkout");
  const common = useTranslations("common");
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) {
      setError(t("stripeUnavailable"));
      return;
    }
    const card = elements.getElement(CardElement);
    if (!card) {
      setError(t("stripeUnavailable"));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const result = await stripe.confirmCardPayment(clientSecret, {payment_method: {card}});
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? t("stripePaymentFailed"));
      return;
    }
    if (result.paymentIntent?.status === "succeeded" || result.paymentIntent?.status === "processing") {
      onSubmitted();
      return;
    }
    setError(t("stripePaymentFailed"));
  }

  return <form className="mt-4 space-y-3" onSubmit={(event) => void submit(event)}><p className="text-xs text-muted-foreground">{t("stripePaymentDescription")}</p><div className="rounded-lg border bg-background p-3"><CardElement options={{hidePostalCode: true, style: {base: {color: "#172033", fontSize: "16px", fontFamily: "inherit", "::placeholder": {color: "#64748b"}}}}} /></div>{error ? <p className="text-sm text-destructive">{error}</p> : null}<Button type="submit" disabled={isSubmitting || !stripe || !elements}><CreditCard className="size-4" />{isSubmitting ? common("loading") : t("payNow")}</Button></form>;
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

function ReviewForm({productId, orderItemId}: {productId: string; orderItemId: string}) {
  const t = useTranslations("orders");
  const create = useCreateProductReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); await create.mutateAsync({productId, request: {orderItemId, rating, comment: comment.trim() || undefined}}); setSubmitted(true); setOpen(false); }
  if (submitted) return <p className="mt-3 text-sm text-emerald-700">{t("reviewSubmitted")}</p>;
  if (!open) return <Button className="mt-3" size="sm" variant="outline" onClick={() => setOpen(true)}><Star className="size-4" />{t("writeReview")}</Button>;
  return <form className="mt-4 space-y-3 rounded-xl border bg-muted/20 p-4" onSubmit={(event) => void submit(event)}><div className="space-y-2"><p className="text-sm font-medium">{t("rating")}</p><div className="flex items-center gap-1" role="radiogroup" aria-label={t("rating")}>{Array.from({length: 5}, (_, index) => {const value = index + 1; return <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value}/5`} className="rounded-md p-1 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => setRating(value)}><Star className={`size-5 ${rating >= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/35"}`} /></button>;})}<span className="ml-2 text-sm font-medium text-muted-foreground">{rating}/5</span></div></div><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={t("reviewPlaceholder")} />{create.isError ? <ErrorMessage error={create.error} /> : null}<div className="flex gap-2"><Button type="submit" size="sm" disabled={create.isPending}>{t("submitReview")}</Button><Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>{t("cancel")}</Button></div></form>;
}
