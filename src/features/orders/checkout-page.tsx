"use client";

import { CheckCircle2, CreditCard, KeyRound, MapPin, ShoppingBag, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api/envelope";
import { isStaffRole } from "@/lib/auth/roles";
import { formatMoney } from "@/lib/format";
import { CatalogCategoryIcon } from "@/features/catalog/components/catalog-category-icon";
import {PaymentMethodCode} from "@/lib/domain/commerce-enums";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

import { useProfile } from "@/features/auth/queries";
import { useAddresses } from "@/features/account/queries";
import { useCart } from "@/features/cart/queries";
import {
  useCreateOrder,
  useCreatePaymentIntent,
  usePaymentMethods,
  useShippingMethods,
  useValidateDiscount,
} from "./queries";

export function CheckoutPage() {
  const t = useTranslations("checkout");
  const nav = useTranslations("nav");
  const common = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const profile = useProfile();
  const isStaff = isStaffRole(profile.data?.role);
  const requiresLogin = profile.isError && profile.error instanceof ApiClientError && profile.error.status === 401;
  const cart = useCart(Boolean(profile.data) && !isStaff);
  const addresses = useAddresses(Boolean(profile.data) && !isStaff);
  const methods = usePaymentMethods();
  const shipping = useShippingMethods();
  const create = useCreateOrder();
  const intent = useCreatePaymentIntent();
  const validate = useValidateDiscount();
  const items = cart.data?.items ?? [];
  const subtotal = cart.data?.subtotalAmount ?? 0;
  // `null` means use the customer's default address on first render. An empty
  // string is an explicit choice to enter a one-off address for this order.
  // Keeping those states separate prevents the controlled select from snapping
  // back to the default whenever a customer chooses "new address".
  const [addressId, setAddressId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>(PaymentMethodCode.Cod);
  const [discountCode, setDiscountCode] = useState("");
  const [note, setNote] = useState("");
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [created, setCreated] = useState<{
    orderId: string;
    paymentIntent?: import("@/features/orders/contracts/responses").PaymentIntent;
  } | null>(null);

  const defaultAddressId =
    addresses.data?.find((item) => item.default)?.id ??
    addresses.data?.[0]?.id ??
    "";
  const selectedAddress =
    addressId === ""
      ? undefined
      : addresses.data?.find(
          (address) => address.id === (addressId ?? defaultAddressId),
        ) ?? addresses.data?.find((address) => address.id === defaultAddressId);
  const resolvedRecipientName = recipientName || profile.data?.fullName || "";
  const resolvedRecipientPhone = recipientPhone || profile.data?.phone || "";
  const discountAmount = validate.data?.isValid
    ? (validate.data.discountAmount ?? 0)
    : 0;
  const shippingOptions = useMemo(
    () => (shipping.data ?? []).filter((method) => method.status === ResourceStatus.Active),
    [shipping.data],
  );
  const selectedShippingCode =
    shippingOptions.find((method) => method.code === shippingMethod)?.code ??
    shippingOptions[0]?.code ??
    "";
  const selectedShipping = shippingOptions.find(
    (method) => method.code === selectedShippingCode,
  );
  const selectedShippingFee = selectedShipping?.fee ?? 0;
  const estimatedTotal = Math.max(
    0,
    subtotal - discountAmount + selectedShippingFee,
  );
  const paymentOptions = useMemo(
    () => (methods.data ?? []).filter((method) => method.status === ResourceStatus.Active),
    [methods.data],
  );
  const selectedPaymentCode = (paymentOptions.find((method) => method.code === paymentMethod)?.code ??
    paymentOptions[0]?.code ??
    "") as PaymentMethodCode | "";
  const hasDeliveryDetails = Boolean(
    selectedAddress ||
      (resolvedRecipientName.trim() &&
        resolvedRecipientPhone.trim() &&
        deliveryAddress.trim()),
  );
  const canSubmit =
    items.length > 0 &&
    hasDeliveryDetails &&
    Boolean(selectedPaymentCode) &&
    Boolean(selectedShippingCode);
  const stripePromise = useMemo(() => {
    const publishableKey =
      created?.paymentIntent?.publishableKey ||
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    return publishableKey ? loadStripe(publishableKey) : null;
  }, [created]);

  async function applyDiscount() {
    if (!discountCode.trim()) return;
    await validate.mutateAsync({
      code: discountCode.trim(),
      orderAmount: subtotal,
      items: items.map((item) => ({
        productVariantId: item.productVariantId!,
        quantity: item.quantity!,
        unitPrice: item.listPrice ?? 0,
      })),
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    const order = await create.mutateAsync({
      items: items.map((item) => ({
        productVariantId: item.productVariantId!,
        quantity: item.quantity!,
      })),
      paymentMethod: selectedPaymentCode as PaymentMethodCode,
      shippingMethodCode: selectedShippingCode,
      discountCode: discountCode.trim() || undefined,
      note: note.trim() || undefined,
      ...(selectedAddress
        ? { customerAddressId: selectedAddress.id }
        : {
            recipientName: resolvedRecipientName.trim(),
            recipientPhone: resolvedRecipientPhone.trim(),
            deliveryAddress: deliveryAddress.trim(),
          }),
    });
    if (!order.id) return;
    if (selectedPaymentCode === PaymentMethodCode.StripeCard) {
      setPaymentSubmitted(false);
      setCreated({ orderId: order.id });
      try {
        const paymentIntent = await intent.mutateAsync({ orderId: order.id });
        setCreated({ orderId: order.id, paymentIntent });
      } catch {
        // The order exists even when the provider intent cannot be prepared.
        // Keep the order reference visible so the customer can retry from its
        // detail page instead of submitting a duplicate order.
      }
    } else {
      setCreated({ orderId: order.id });
    }
  }

  if (profile.isPending)
    return (
      <section className="page-wrap py-16">
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </section>
    );
  if (profile.isError && !requiresLogin)
    return (
      <section className="page-wrap max-w-2xl py-16">
        <ErrorMessage error={profile.error} />
      </section>
    );
  if (requiresLogin)
    return (
      <section className="page-wrap max-w-2xl py-16">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <KeyRound className="size-10 text-primary" />
            <h1 className="mt-4 text-2xl font-semibold">{nav("login")}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("loginRequired")}</p>
            <Link href="/login?redirect=%2Fcheckout" className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85">{nav("login")}</Link>
          </CardContent>
        </Card>
      </section>
    );
  if (isStaff)
    return (
      <section className="page-wrap max-w-2xl py-16">
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <ShoppingBag className="size-10 text-primary" />
            <h1 className="mt-4 text-2xl font-semibold">{t("staffTitle")}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("staffDescription")}</p>
            <Link href="/admin/orders" className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">{t("openAdminOrders")}</Link>
          </CardContent>
        </Card>
      </section>
    );
  if (cart.isPending)
    return (
      <section className="page-wrap py-16">
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </section>
    );
  if (cart.isError)
    return (
      <section className="page-wrap py-16">
        <ErrorMessage error={cart.error} />
        <Link
          href="/cart"
          className="mt-5 inline-flex text-sm font-medium hover:underline"
        >
          {t("backToCart")}
        </Link>
      </section>
    );
  if (created)
    return (
      <section className="page-wrap max-w-3xl py-16">
        <Card>
          <CardContent className="space-y-5 p-8 text-center">
            <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
            <h1 className="text-3xl font-semibold">{t("orderCreated")}</h1>
            <p className="text-muted-foreground">
              {t("orderCreatedDescription")}
            </p>
            {created.paymentIntent ? (
              <div className="rounded-xl border bg-muted/40 p-4 text-left text-sm">
                <p className="font-medium">{t("paymentReady")}</p>
                {paymentSubmitted ? (
                  <p className="mt-2 text-emerald-700">
                    {t("paymentSubmitted")}
                  </p>
                ) : stripePromise && created.paymentIntent.clientSecret ? (
                  <Elements stripe={stripePromise}>
                    <StripeCardForm
                      clientSecret={created.paymentIntent.clientSecret}
                      onSubmitted={() => setPaymentSubmitted(true)}
                    />
                  </Elements>
                ) : (
                  <p className="mt-2 text-muted-foreground">
                    {t("stripeConfigurationMissing")}
                  </p>
                )}
                {!paymentSubmitted ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("paymentIntegrationNote")}
                  </p>
                ) : null}
              </div>
            ) : null}
            {intent.isError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
                <p className="font-medium">{t("stripeUnavailable")}</p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  {t("paymentIntegrationNote")}
                </p>
              </div>
            ) : null}
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => router.push(`/orders/${created.orderId}`)}>
                {t("viewOrder")}
              </Button>
              <Link
                href="/products"
                className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
              >
                {t("continueShopping")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    );

  return (
    <section className="page-wrap py-12 sm:py-16">
      <div className="mb-10 space-y-3">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <form
        className="grid gap-6 lg:grid-cols-[1fr_22rem]"
        onSubmit={(event) => void submit(event)}
      >
        <div className="space-y-6">
          <CheckoutItemsCard items={items} locale={locale} />
          <Card>
            <CardHeader>
              <CardTitle>
                <MapPin className="mr-2 inline size-5" />
                {t("delivery")}
              </CardTitle>
              <CardDescription>{t("deliveryDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.data && addresses.data.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="saved-address">{t("savedAddress")}</Label>
                  <Select
                    id="saved-address"
                    value={addressId ?? defaultAddressId}
                    onChange={(event) => setAddressId(event.target.value)}
                  >
                    <option value="">{t("newAddress")}</option>
                    {addresses.data.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.recipientName} · {address.addressLine}
                        {address.default ? ` (${t("default")})` : ""}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : null}
              {selectedAddress ? (
                <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                  <p className="font-medium">
                    {selectedAddress.recipientName} · {selectedAddress.phone}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {selectedAddress.addressLine}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="recipient"
                    label={t("recipientName")}
                    value={resolvedRecipientName}
                    onChange={setRecipientName}
                    required
                  />
                  <Field
                    id="recipient-phone"
                    label={t("recipientPhone")}
                    value={resolvedRecipientPhone}
                    onChange={setRecipientPhone}
                    required
                  />
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="delivery-address">
                      {t("deliveryAddress")}
                    </Label>
                    <Textarea
                      id="delivery-address"
                      value={deliveryAddress}
                      onChange={(event) =>
                        setDeliveryAddress(event.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <Truck className="mr-2 inline size-5" />
                {t("shipping")}
              </CardTitle>
              <CardDescription>{t("shippingDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {shipping.isPending ? (
                <div className="h-20 animate-pulse rounded-xl bg-muted" />
              ) : shipping.isError ? (
                <ErrorMessage error={shipping.error} />
              ) : shippingOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("shippingMethodsUnavailable")}
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  {shippingOptions.map((option) => (
                    <label
                      key={option.code}
                      className={`cursor-pointer rounded-xl border p-4 text-sm transition ${selectedShippingCode === option.code ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/40"}`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name="shipping"
                        value={option.code}
                        checked={selectedShippingCode === option.code}
                        onChange={() => setShippingMethod(option.code ?? "")}
                      />
                      <span className="font-medium">
                        {option.name ?? option.code}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {option.code}
                      </span>
                      <span className="mt-3 block font-semibold">
                        {formatMoney(option.fee, locale)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <CreditCard className="mr-2 inline size-5" />
                {t("payment")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("paymentMethodsUnavailable")}
                </p>
              ) : (
                paymentOptions.map((method) => (
                  <label
                    key={method.code}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${selectedPaymentCode === method.code ? "border-primary bg-primary/5" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.code}
                      checked={selectedPaymentCode === method.code}
                      onChange={() => setPaymentMethod((method.code ?? PaymentMethodCode.Cod) as PaymentMethodCode)}
                    />
                    <span>
                      <span className="block font-medium">
                        {method.name ?? method.code}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {method.code}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("note")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("notePlaceholder")}
              />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>{t("voucher")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={discountCode}
                  onChange={(event) => {
                    setDiscountCode(event.target.value.toUpperCase());
                    // A previous validation result must never be reused for a
                    // newly edited voucher code or the quote can display the
                    // wrong discount before the backend recalculates it.
                    validate.reset();
                  }}
                  placeholder={t("voucherPlaceholder")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void applyDiscount()}
                  disabled={validate.isPending || !discountCode.trim()}
                >
                  {t("apply")}
                </Button>
              </div>
              {validate.data ? (
                <p
                  className={`mt-3 text-sm ${validate.data.isValid ? "text-emerald-700" : "text-destructive"}`}
                >
                  {validate.data.message ??
                    (validate.data.isValid
                      ? t("voucherApplied")
                      : t("voucherInvalid"))}
                </p>
              ) : null}
              {validate.isError ? (
                <div className="mt-3">
                  <ErrorMessage error={validate.error} />
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryLine
                label={t("subtotal")}
                value={formatMoney(subtotal, locale)}
              />
              <SummaryLine
                label={t("discount")}
                value={`− ${formatMoney(discountAmount, locale)}`}
              />
              <SummaryLine
                label={t("shippingFee")}
                value={
                  selectedShipping
                    ? formatMoney(selectedShipping.fee, locale)
                    : t("shippingPending")
                }
              />
              <div className="border-t pt-3">
                <SummaryLine
                  label={t("estimatedTotal")}
                  value={formatMoney(estimatedTotal, locale)}
                  strong
                />
                <p className="text-xs text-muted-foreground">
                  {t("shippingSnapshotNote")}
                </p>
              </div>
              <Button
                type="submit"
                className="mt-3 w-full"
                disabled={
                  create.isPending ||
                  intent.isPending ||
                  !canSubmit ||
                  paymentOptions.length === 0 ||
                  shipping.isPending ||
                  shippingOptions.length === 0
                }
              >
                {create.isPending || intent.isPending
                  ? common("loading")
                  : t("placeOrder")}
              </Button>
              {create.isError ? (
                <div className="mt-3">
                  <ErrorMessage error={create.error} />
                </div>
              ) : null}
              {intent.isError ? (
                <div className="mt-3">
                  <ErrorMessage error={intent.error} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </form>
    </section>
  );
}

function CheckoutItemsCard({
  items,
  locale,
}: {
  items: import("@/features/cart/contracts/responses").CartItem[];
  locale: string;
}) {
  const t = useTranslations("checkout");
  const nav = useTranslations("nav");

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{t("items")}</CardTitle>
          <CardDescription>
            {t("itemsDescription", { count: items.length })}
          </CardDescription>
        </div>
        <Link
          href="/cart"
          className="shrink-0 text-sm font-semibold text-primary hover:underline"
        >
          {t("editCart")}
        </Link>
      </CardHeader>
      <CardContent className="divide-y">
        {items.map((item, index) => (
          <div
            key={item.productVariantId ?? index}
            className="flex gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/60">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.productName ?? ""}
                  fill
                  sizes="56px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <CatalogCategoryIcon
                  categoryName={item.productName ?? item.model}
                  className="size-7 text-primary/50"
                  strokeWidth={1.45}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium">
                {item.productName ?? item.sku ?? nav("products")}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {item.model ?? item.sku ?? "—"}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span>{t("quantityShort", { count: item.quantity ?? 0 })}</span>
                <span aria-hidden="true">·</span>
                <span>{formatMoney(item.listPrice, locale)}</span>
              </div>
            </div>
            <p className="shrink-0 self-center text-sm font-semibold">
              {formatMoney(item.subtotal, locale)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StripeCardForm({
  clientSecret,
  onSubmitted,
}: {
  clientSecret: string;
  onSubmitted: () => void;
}) {
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
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? t("stripePaymentFailed"));
      return;
    }
    if (
      result.paymentIntent?.status === "succeeded" ||
      result.paymentIntent?.status === "processing"
    ) {
      onSubmitted();
      return;
    }
    setError(t("stripePaymentFailed"));
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={(event) => void submit(event)}>
      <p className="text-xs text-muted-foreground">
        {t("stripePaymentDescription")}
      </p>
      <div className="rounded-lg border bg-background p-3">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                color: "#172033",
                fontSize: "16px",
                fontFamily: "inherit",
                "::placeholder": { color: "#64748b" },
              },
            },
          }}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting || !stripe || !elements}>
        <CreditCard className="size-4" />
        {isSubmitting ? common("loading") : t("payNow")}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </div>
  );
}
function SummaryLine({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${strong ? "text-base font-semibold" : ""}`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
