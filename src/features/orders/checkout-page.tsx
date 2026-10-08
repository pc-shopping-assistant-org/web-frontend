"use client";

import { CheckCircle2, CreditCard, KeyRound, MapPin, ShoppingBag, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { CheckoutPageSkeleton } from "@/components/ui/loading-skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api/envelope";
import { isStaffRole } from "@/lib/auth/roles";
import { formatMoney } from "@/lib/format";
import { CatalogCategoryIcon } from "@/features/catalog/components/catalog-category-icon";
import { OrderStatus, PaymentMethodCode } from "@/lib/domain/commerce-enums";

import { useProfile } from "@/features/auth/queries";
import { useAddresses } from "@/features/account/queries";
import { useCart } from "@/features/cart/queries";
import type { CartItem } from "@/features/cart/models";
import type { OrderDetail } from "./models";
import { VnpayAutoRedirect } from "./vnpay-pay";
import {
  useCreateOrder,
  useDiscountPreview,
  usePaymentMethods,
  useShippingMethods,
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
  const canLoad = Boolean(profile.data) && !isStaff;
  const cart = useCart(canLoad);
  const addresses = useAddresses(canLoad);
  const methods = usePaymentMethods(canLoad);
  const shipping = useShippingMethods(canLoad);
  const create = useCreateOrder();
  // The same key for every attempt of this checkout: a retry after a lost answer returns the order instead of a second one.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const allItems = cart.data?.items ?? [];
  const items = allItems.filter((item) => item.available);
  const hasUnavailable = allItems.length > items.length;
  const subtotal = cart.data?.subtotalAmount ?? 0;
  // `null` means use the customer's default address on first render. An empty
  // string is an explicit choice to enter a one-off address for this order.
  const [addressId, setAddressId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [shippingId, setShippingId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState("");
  const [note, setNote] = useState("");
  const [created, setCreated] = useState<OrderDetail | null>(null);

  const previewLines = items.map((item) => ({
    productVariantId: item.productVariantId,
    quantity: item.quantity,
    unitPrice: item.price,
    categoryId: item.categoryId,
  }));
  // The line discounts always count; the voucher is priced on top and only applies when the backend accepts the code.
  const hasLines = canLoad && items.length > 0;
  const linePreview = useDiscountPreview(hasLines ? { orderAmount: subtotal, items: previewLines } : null);
  const voucherPreview = useDiscountPreview(hasLines && appliedVoucher ? { code: appliedVoucher, orderAmount: subtotal, items: previewLines } : null);
  const voucherApplied = Boolean(appliedVoucher) && voucherPreview.isSuccess;
  const itemDiscount = (voucherApplied ? voucherPreview.data : linePreview.data)?.itemDiscountAmount ?? 0;
  const lineDiscounts = (voucherApplied ? voucherPreview.data : linePreview.data)?.lineDiscounts ?? {};
  const voucherDiscount = voucherApplied ? voucherPreview.data.orderDiscountAmount : 0;

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
  const shippingOptions = shipping.data ?? [];
  const selectedShipping = shippingOptions.find((method) => method.id === shippingId) ?? shippingOptions[0];
  const paymentOptions = methods.data ?? [];
  const selectedPayment = paymentOptions.find((method) => method.id === paymentId) ?? paymentOptions[0];
  const estimatedTotal = Math.max(0, subtotal - itemDiscount - voucherDiscount + (selectedShipping?.fee ?? 0));
  const hasDeliveryDetails = Boolean(
    selectedAddress ||
      (resolvedRecipientName.trim() &&
        resolvedRecipientPhone.trim() &&
        deliveryAddress.trim()),
  );
  const canSubmit =
    items.length > 0 &&
    !hasUnavailable &&
    hasDeliveryDetails &&
    Boolean(selectedPayment) &&
    Boolean(selectedShipping);

  function applyVoucher() {
    setAppliedVoucher(voucherInput.trim());
  }

  function clearVoucher() {
    setVoucherInput("");
    setAppliedVoucher("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || !selectedShipping || !selectedPayment) return;
    try {
      setCreated(await create.mutateAsync({
        idempotencyKey,
        shippingMethodId: selectedShipping.id,
        paymentMethodId: selectedPayment.id,
        discountCode: voucherApplied ? appliedVoucher : undefined,
        note: note.trim() || undefined,
        ...(selectedAddress
          ? { customerAddressId: selectedAddress.id }
          : {
              recipientName: resolvedRecipientName.trim(),
              recipientPhone: resolvedRecipientPhone.trim(),
              deliveryAddress: deliveryAddress.trim(),
            }),
      }));
    } catch {
      // the failed mutation shows its own error next to the button
    }
  }

  if (profile.isPending) return <CheckoutPageSkeleton />;
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
  if (created)
    return (
      <section className="page-wrap max-w-3xl py-16">
        <Card>
          <CardContent className="space-y-5 p-8 text-center">
            <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
            <h1 className="text-3xl font-semibold">{t("orderCreated")}</h1>
            <p className="text-muted-foreground">{t("orderCreatedDescription")}</p>
            <p className="text-sm">
              <span className="text-muted-foreground">{t("invoiceNumber")}: </span>
              <span className="font-semibold">{created.invoiceNumber}</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="font-semibold">{formatMoney(created.totalAmount, locale)}</span>
            </p>
            {created.status === OrderStatus.PendingPayment && paymentOptions.find((method) => method.id === created.paymentMethodId)?.code === PaymentMethodCode.Vnpay ? (
              <VnpayAutoRedirect orderId={created.id} />
            ) : (
              <p className="rounded-xl border bg-muted/40 p-4 text-sm">
                {created.status === OrderStatus.PendingPayment ? t("awaitingPaymentNote") : t("awaitingConfirmationNote")}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => router.push(`/orders/${created.id}`)}>
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
  if (cart.isPending) return <CheckoutPageSkeleton />;
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
  if (allItems.length === 0)
    return (
      <section className="page-wrap max-w-2xl py-16">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-semibold">{t("emptyCart")}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("emptyCartDescription")}</p>
            <Link href="/products" className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">{t("continueShopping")}</Link>
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
          <CheckoutItemsCard items={allItems} lineDiscounts={lineDiscounts} locale={locale} />
          {hasUnavailable ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {t("unavailableItems")}
            </p>
          ) : null}
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
                      maxLength={500}
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
                <Skeleton className="h-20 rounded-xl" />
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
                      key={option.id}
                      className={`cursor-pointer rounded-xl border p-4 text-sm transition ${selectedShipping?.id === option.id ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/40"}`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name="shipping"
                        value={option.id}
                        checked={selectedShipping?.id === option.id}
                        onChange={() => setShippingId(option.id)}
                      />
                      <span className="font-medium">{option.name}</span>
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
              {methods.isPending ? (
                <Skeleton className="h-14 rounded-xl" />
              ) : methods.isError ? (
                <ErrorMessage error={methods.error} />
              ) : paymentOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("paymentMethodsUnavailable")}
                </p>
              ) : (
                paymentOptions.map((method) => (
                  <label
                    key={method.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${selectedPayment?.id === method.id ? "border-primary bg-primary/5" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selectedPayment?.id === method.id}
                      onChange={() => setPaymentId(method.id)}
                    />
                    <span className="font-medium">{method.name}</span>
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
                  value={voucherInput}
                  maxLength={50}
                  onChange={(event) => setVoucherInput(event.target.value.toUpperCase())}
                  placeholder={t("voucherPlaceholder")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyVoucher}
                  disabled={voucherPreview.isFetching || !voucherInput.trim()}
                >
                  {t("apply")}
                </Button>
              </div>
              {voucherApplied ? (
                <p className="mt-3 flex items-center justify-between gap-2 text-sm text-emerald-700">
                  <span>{t("voucherApplied")}</span>
                  <button type="button" className="text-xs font-medium underline" onClick={clearVoucher}>
                    {t("removeVoucher")}
                  </button>
                </p>
              ) : null}
              {appliedVoucher && voucherPreview.isError ? (
                <div className="mt-3">
                  <ErrorMessage error={voucherPreview.error} />
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
                label={t("itemDiscountLabel")}
                value={`− ${formatMoney(itemDiscount, locale)}`}
              />
              <SummaryLine
                label={t("voucherDiscountLabel")}
                value={`− ${formatMoney(voucherDiscount, locale)}`}
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
                  label={t("total")}
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
                disabled={create.isPending || !canSubmit}
              >
                {create.isPending ? common("loading") : t("placeOrder")}
              </Button>
              {create.isError ? (
                <div className="mt-3">
                  <ErrorMessage error={create.error} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </form>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
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
    <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function CheckoutItemsCard({
  items,
  lineDiscounts,
  locale,
}: {
  items: CartItem[];
  lineDiscounts: Record<string, number>;
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
        {items.map((item) => {
          const discount = lineDiscounts[item.productVariantId] ?? 0;
          return (
            <div key={item.productVariantId} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/60">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    sizes="56px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <CatalogCategoryIcon
                    categoryName={item.productName || item.model}
                    className="size-7 text-primary/50"
                    strokeWidth={1.45}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">
                  {item.productName || item.sku || nav("products")}
                </p>
                {item.variantLabel ? (
                  <p className="mt-0.5 truncate text-xs text-foreground/80">{item.variantLabel}</p>
                ) : null}
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.model ?? item.sku ?? "—"}
                </p>
                {item.available ? (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{t("quantityShort", { count: item.quantity })}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatMoney(item.price, locale)}</span>
                  </div>
                ) : (
                  <p className="mt-1 text-xs font-medium text-destructive">{t("itemUnavailable")}</p>
                )}
              </div>
              {item.available ? (
                <div className="shrink-0 self-center text-right">
                  {discount > 0 ? (
                    <p className="text-xs text-muted-foreground line-through">{formatMoney(item.subtotal, locale)}</p>
                  ) : null}
                  <p className="text-sm font-semibold">{formatMoney(item.subtotal - discount, locale)}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
