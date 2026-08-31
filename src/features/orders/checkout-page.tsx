"use client";

import {CheckCircle2, CreditCard, MapPin, Truck} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useMemo, useState, type FormEvent} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Link, useRouter} from "@/i18n/navigation";
import {formatMoney} from "@/lib/format";

import {useProfile} from "@/features/auth/queries";
import {useAddresses} from "@/features/account/queries";
import {useCart} from "@/features/cart/queries";
import {useCreateOrder, useCreatePaymentIntent, usePaymentMethods, useValidateDiscount} from "./queries";

const shippingOptions = [
  {code: "STANDARD", label: "Standard"},
  {code: "EXPRESS", label: "Express"},
  {code: "SAME_DAY", label: "Same day"},
] as const;

export function CheckoutPage() {
  const t = useTranslations("checkout");
  const common = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const cart = useCart();
  const profile = useProfile();
  const addresses = useAddresses();
  const methods = usePaymentMethods();
  const create = useCreateOrder();
  const intent = useCreatePaymentIntent();
  const validate = useValidateDiscount();
  const items = cart.data?.items ?? [];
  const subtotal = cart.data?.subtotalAmount ?? 0;
  const [addressId, setAddressId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [discountCode, setDiscountCode] = useState("");
  const [note, setNote] = useState("");
  const [created, setCreated] = useState<{orderId: string; paymentIntent?: import("@/lib/api/types").PaymentIntent} | null>(null);

  const defaultAddressId = addresses.data?.find((item) => item.default)?.id ?? addresses.data?.[0]?.id ?? "";
  const selectedAddress = addresses.data?.find((address) => address.id === (addressId || defaultAddressId));
  const resolvedRecipientName = recipientName || profile.data?.fullName || "";
  const resolvedRecipientPhone = recipientPhone || profile.data?.phone || "";
  const discountAmount = validate.data?.isValid ? validate.data.discountAmount ?? 0 : 0;
  // Shipping is resolved by the backend from the selected method and is only
  // known once the order is created. Keep the pre-submit amount explicit so
  // the UI never presents a subtotal as the final financial snapshot.
  const estimatedTotal = Math.max(0, subtotal - discountAmount);
  const canSubmit = items.length > 0 && Boolean(paymentMethod);
  const paymentOptions = useMemo(() => (methods.data ?? []).filter((method) => method.status === "ACTIVE"), [methods.data]);

  async function applyDiscount() {
    if (!discountCode.trim()) return;
    await validate.mutateAsync({code: discountCode.trim(), orderAmount: subtotal, items: items.map((item) => ({productVariantId: item.productVariantId!, quantity: item.quantity!, unitPrice: item.listPrice ?? 0}))});
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    const order = await create.mutateAsync({items: items.map((item) => ({productVariantId: item.productVariantId!, quantity: item.quantity!})), paymentMethod, shippingMethodCode: shippingMethod, discountCode: discountCode.trim() || undefined, note: note.trim() || undefined, ...(selectedAddress ? {customerAddressId: selectedAddress.id} : {recipientName: resolvedRecipientName.trim(), recipientPhone: resolvedRecipientPhone.trim(), deliveryAddress: deliveryAddress.trim()})});
    if (!order.id) return;
    if (paymentMethod === "STRIPE_CARD") {
      const paymentIntent = await intent.mutateAsync({orderId: order.id});
      setCreated({orderId: order.id, paymentIntent});
    } else {
      setCreated({orderId: order.id});
    }
  }

  if (cart.isPending) return <section className="page-wrap py-16"><div className="h-72 animate-pulse rounded-2xl bg-muted" /></section>;
  if (cart.isError) return <section className="page-wrap py-16"><ErrorMessage error={cart.error} /><Link href="/cart" className="mt-5 inline-flex text-sm font-medium hover:underline">{t("backToCart")}</Link></section>;
  if (created) return <section className="page-wrap max-w-3xl py-16"><Card><CardContent className="space-y-5 p-8 text-center"><CheckCircle2 className="mx-auto size-12 text-emerald-600" /><h1 className="text-3xl font-semibold">{t("orderCreated")}</h1><p className="text-muted-foreground">{t("orderCreatedDescription")}</p>{created.paymentIntent ? <div className="rounded-xl border bg-muted/40 p-4 text-left text-sm"><p className="font-medium">{t("paymentReady")}</p><p className="mt-2 break-all text-muted-foreground">{t("paymentClientSecret")}: {created.paymentIntent.clientSecret ?? "—"}</p><p className="mt-1 text-muted-foreground">{t("paymentIntegrationNote")}</p></div> : null}<div className="flex flex-wrap justify-center gap-3"><Button onClick={() => router.push(`/orders/${created.orderId}`)}>{t("viewOrder")}</Button><Link href="/products" className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted">{t("continueShopping")}</Link></div></CardContent></Card></section>;

  return <section className="page-wrap py-12 sm:py-16"><div className="mb-10 space-y-3"><p className="eyebrow">{t("eyebrow")}</p><h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1><p className="text-muted-foreground">{t("description")}</p></div><form className="grid gap-6 lg:grid-cols-[1fr_22rem]" onSubmit={(event) => void submit(event)}><div className="space-y-6"><Card><CardHeader><CardTitle><MapPin className="mr-2 inline size-5" />{t("delivery")}</CardTitle><CardDescription>{t("deliveryDescription")}</CardDescription></CardHeader><CardContent className="space-y-4">{addresses.data && addresses.data.length > 0 ? <div className="space-y-2"><Label htmlFor="saved-address">{t("savedAddress")}</Label><Select id="saved-address" value={addressId || defaultAddressId} onChange={(event) => setAddressId(event.target.value)}><option value="">{t("newAddress")}</option>{addresses.data.map((address) => <option key={address.id} value={address.id}>{address.recipientName} · {address.addressLine}{address.default ? ` (${t("default")})` : ""}</option>)}</Select></div> : null}{selectedAddress ? <div className="rounded-xl border bg-muted/30 p-4 text-sm"><p className="font-medium">{selectedAddress.recipientName} · {selectedAddress.phone}</p><p className="mt-1 text-muted-foreground">{selectedAddress.addressLine}</p></div> : <div className="grid gap-4 sm:grid-cols-2"><Field id="recipient" label={t("recipientName")} value={resolvedRecipientName} onChange={setRecipientName} required /><Field id="recipient-phone" label={t("recipientPhone")} value={resolvedRecipientPhone} onChange={setRecipientPhone} required /><div className="space-y-2 sm:col-span-2"><Label htmlFor="delivery-address">{t("deliveryAddress")}</Label><Textarea id="delivery-address" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} required /></div></div>}</CardContent></Card><Card><CardHeader><CardTitle><Truck className="mr-2 inline size-5" />{t("shipping")}</CardTitle><CardDescription>{t("shippingDescription")}</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-3">{shippingOptions.map((option) => <label key={option.code} className={`cursor-pointer rounded-xl border p-4 text-sm ${shippingMethod === option.code ? "border-primary bg-primary/5" : ""}`}><input type="radio" className="sr-only" name="shipping" value={option.code} checked={shippingMethod === option.code} onChange={() => setShippingMethod(option.code)} /><span className="font-medium">{option.label}</span><span className="mt-1 block text-xs text-muted-foreground">{option.code} · {t("feeCalculated")}</span></label>)}</div></CardContent></Card><Card><CardHeader><CardTitle><CreditCard className="mr-2 inline size-5" />{t("payment")}</CardTitle></CardHeader><CardContent className="space-y-3">{paymentOptions.length === 0 ? <p className="text-sm text-muted-foreground">{t("paymentMethodsUnavailable")}</p> : paymentOptions.map((method) => <label key={method.code} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${paymentMethod === method.code ? "border-primary bg-primary/5" : ""}`}><input type="radio" name="payment" value={method.code} checked={paymentMethod === method.code} onChange={() => setPaymentMethod(method.code ?? "COD")} /><span><span className="block font-medium">{method.name ?? method.code}</span><span className="text-xs text-muted-foreground">{method.code}</span></span></label>)}</CardContent></Card><Card><CardHeader><CardTitle>{t("note")}</CardTitle></CardHeader><CardContent><Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("notePlaceholder")} /></CardContent></Card></div><div className="space-y-6"><Card className="h-fit"><CardHeader><CardTitle>{t("voucher")}</CardTitle></CardHeader><CardContent><div className="flex gap-2"><Input value={discountCode} onChange={(event) => setDiscountCode(event.target.value.toUpperCase())} placeholder={t("voucherPlaceholder")} /><Button type="button" variant="outline" onClick={() => void applyDiscount()} disabled={validate.isPending || !discountCode.trim()}>{t("apply")}</Button></div>{validate.data ? <p className={`mt-3 text-sm ${validate.data.isValid ? "text-emerald-700" : "text-destructive"}`}>{validate.data.message ?? (validate.data.isValid ? t("voucherApplied") : t("voucherInvalid"))}</p> : null}{validate.isError ? <div className="mt-3"><ErrorMessage error={validate.error} /></div> : null}</CardContent></Card><Card className="h-fit"><CardHeader><CardTitle>{t("summary")}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><SummaryLine label={t("subtotal")} value={formatMoney(subtotal, locale)} /><SummaryLine label={t("discount")} value={`− ${formatMoney(discountAmount, locale)}`} /><SummaryLine label={t("shippingFee")} value={t("calculatedAtOrder")} /><div className="border-t pt-3"><SummaryLine label={t("estimatedTotal")} value={formatMoney(estimatedTotal, locale)} strong /><p className="text-xs text-muted-foreground">{t("totalExcludesShipping")}</p></div><Button type="submit" className="mt-3 w-full" disabled={create.isPending || intent.isPending || !canSubmit || paymentOptions.length === 0}>{create.isPending || intent.isPending ? common("loading") : t("placeOrder")}</Button>{create.isError ? <div className="mt-3"><ErrorMessage error={create.error} /></div> : null}{intent.isError ? <div className="mt-3"><ErrorMessage error={intent.error} /></div> : null}</CardContent></Card></div></form></section>;
}

function Field({id, label, value, onChange, type = "text", required}: {id: string; label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean}) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></div>; }
function SummaryLine({label, value, strong}: {label: string; value: string; strong?: boolean}) { return <div className={`flex items-center justify-between gap-4 ${strong ? "text-base font-semibold" : ""}`}><span className="text-muted-foreground">{label}</span><span>{value}</span></div>; }
