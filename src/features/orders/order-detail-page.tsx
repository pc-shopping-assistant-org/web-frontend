"use client";

import {ArrowLeft, Ban, Star} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState, type FormEvent} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {StatusBadge} from "@/components/ui/status-badge";
import {Textarea} from "@/components/ui/textarea";
import {Link} from "@/i18n/navigation";
import {formatMoney} from "@/lib/format";

import {useCreateProductReview} from "@/features/catalog/queries";
import {useCancelOrder, useOrder} from "./queries";

export function OrderDetailPage({orderId}: {orderId: string}) {
  const t = useTranslations("orders");
  const common = useTranslations("common");
  const locale = useLocale();
  const query = useOrder(orderId);
  const cancel = useCancelOrder();
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("");
  if (query.isPending) return <section className="page-wrap py-16"><div className="h-96 animate-pulse rounded-2xl bg-muted" /></section>;
  if (query.isError || !query.data) return <section className="page-wrap py-16"><Link href="/orders" className="mb-6 inline-flex items-center gap-2 text-sm hover:underline"><ArrowLeft className="size-4" />{t("backToOrders")}</Link><ErrorMessage error={query.error ?? new Error("UNKNOWN")} /></section>;
  const order = query.data;
  const canCancel = order.status === "PENDING_PAYMENT" || order.status === "PENDING_CONFIRMATION";
  async function submitCancel(event: FormEvent) { event.preventDefault(); await cancel.mutateAsync({orderId, reason: reason.trim() || undefined}); setShowCancel(false); }
  return <section className="page-wrap py-12 sm:py-16"><Link href="/orders" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{t("backToOrders")}</Link><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{t("orderNumber")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{order.id}</h1><p className="mt-2 text-sm text-muted-foreground">{order.orderTime ? new Date(order.orderTime).toLocaleString(locale === "vi" ? "vi-VN" : "en-US") : "—"}</p></div><div className="flex items-center gap-3"><StatusBadge status={order.status} label={order.status ? t(`status.${order.status}`, {default: order.status}) : undefined} />{canCancel ? <Button variant="destructive" onClick={() => setShowCancel(true)}><Ban className="size-4" />{t("cancel")}</Button> : null}</div></div>{cancel.isError ? <div className="mb-5"><ErrorMessage error={cancel.error} /></div> : null}<div className="grid gap-6 lg:grid-cols-[1fr_22rem]"><div className="space-y-6"><Card><CardHeader><CardTitle>{t("items")}</CardTitle></CardHeader><CardContent className="divide-y">{order.items?.map((item, index) => <div key={item.id ?? index} className="flex gap-4 py-5 first:pt-0 last:pb-0"><div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">{item.imageUrl ? <img src={item.imageUrl} alt={item.productName ?? ""} className="h-full w-full object-cover" /> : null}</div><div className="min-w-0 flex-1"><p className="font-medium">{item.productName ?? item.sku}</p><p className="text-sm text-muted-foreground">{item.quantity} × {formatMoney(item.unitPrice, locale)}</p><p className="mt-1 text-sm font-semibold">{formatMoney(item.totalAmount, locale)}</p>{order.status === "COMPLETED" && item.id && item.productId ? <ReviewForm productId={item.productId} orderItemId={item.id} /> : null}</div></div>)}</CardContent></Card><Card><CardHeader><CardTitle>{t("paymentAttempts")}</CardTitle></CardHeader><CardContent className="space-y-3">{order.payments?.length ? order.payments.map((payment, index) => <div key={payment.id ?? index} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{payment.paymentMethodCode ?? "—"}</span><span className="flex items-center gap-3"><span>{formatMoney(payment.amount, locale)}</span><StatusBadge status={payment.status} /></span></div>) : <p className="text-sm text-muted-foreground">{t("noPayments")}</p>}</CardContent></Card></div><div className="space-y-6"><Card><CardHeader><CardTitle>{t("deliverySnapshot")}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p className="font-medium">{order.recipientName}</p><p>{order.recipientPhone}</p><p className="leading-6 text-muted-foreground">{order.deliveryAddress}</p><p className="pt-2 text-muted-foreground">{t("shippingMethod")}: {order.shippingMethodCode ?? "STANDARD"}</p></CardContent></Card><Card><CardHeader><CardTitle>{t("summary")}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Summary label={t("subtotal")} value={formatMoney(order.subtotalAmount, locale)} /><Summary label={t("discount")} value={`− ${formatMoney(order.discountAmount, locale)}`} /><Summary label={t("shippingFee")} value={formatMoney(order.shippingFee, locale)} /><div className="border-t pt-3"><Summary label={t("total")} value={formatMoney(order.totalAmount, locale)} strong /></div></CardContent></Card></div></div>{showCancel ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-6 shadow-xl" onSubmit={(event) => void submitCancel(event)}><h2 className="text-lg font-semibold">{t("cancelOrder")}</h2><div className="space-y-2"><Label htmlFor="cancel-reason">{t("cancelReason")}</Label><Textarea id="cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)} /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCancel(false)}>{common("back")}</Button><Button type="submit" variant="destructive" disabled={cancel.isPending}>{t("confirmCancel")}</Button></div></form></div> : null}</section>;
}

function Summary({label, value, strong}: {label: string; value: string; strong?: boolean}) { return <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : ""}`}><span className="text-muted-foreground">{label}</span><span>{value}</span></div>; }

function ReviewForm({productId, orderItemId}: {productId: string; orderItemId: string}) {
  const t = useTranslations("orders");
  const create = useCreateProductReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); await create.mutateAsync({productId, request: {orderItemId, rating, comment: comment.trim() || undefined}}); setOpen(false); }
  if (!open) return <Button className="mt-3" size="sm" variant="outline" onClick={() => setOpen(true)}><Star className="size-4" />{t("writeReview")}</Button>;
  return <form className="mt-4 space-y-3 rounded-xl border bg-muted/20 p-4" onSubmit={(event) => void submit(event)}><div className="space-y-2"><Label htmlFor={`rating-${orderItemId}`}>{t("rating")}</Label><Input id={`rating-${orderItemId}`} type="number" min={1} max={5} value={rating} onChange={(event) => setRating(Math.max(1, Math.min(5, Number(event.target.value) || 1)))} /></div><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={t("reviewPlaceholder")} />{create.isError ? <ErrorMessage error={create.error} /> : null}<div className="flex gap-2"><Button type="submit" size="sm" disabled={create.isPending}>{t("submitReview")}</Button><Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>{t("cancel")}</Button></div></form>;
}
