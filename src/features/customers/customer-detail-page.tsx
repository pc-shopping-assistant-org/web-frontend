"use client";

import {ArrowLeft, Lock} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ConfirmAction} from "@/components/ui/confirm-action";
import {ErrorMessage} from "@/components/ui/error-message";
import {PersonAvatar} from "@/components/ui/person-avatar";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusBadge} from "@/components/ui/status-badge";
import {AdminPagination} from "@/features/admin/admin-pagination";
import {useAdminOrders} from "@/features/orders/queries";
import {Link} from "@/i18n/navigation";
import {AccountStatus} from "@/lib/domain/account-enums";
import {formatMoney} from "@/lib/format";

import {EmployeeOnly} from "./employee-only";
import type {CustomerDetail} from "./models";
import {useCustomer, useLockCustomer} from "./queries";

const ORDERS_PAGE_SIZE = 10;

/** One customer: the profile, the saved addresses, the orders, and the lock. Only the employee runs them. */
export function CustomerDetailPage({customerId}: {customerId: string}) {
  return <EmployeeOnly><CustomerLoader customerId={customerId} /></EmployeeOnly>;
}

function CustomerLoader({customerId}: {customerId: string}) {
  const t = useTranslations("customers");
  const customer = useCustomer(customerId);
  const back = <Link href="/admin/customers" className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{t("back")}</Link>;

  if (customer.isPending) return <Skeleton className="h-96 rounded-2xl" />;
  if (customer.isError) return <>{back}<ErrorMessage error={customer.error} /></>;
  return <div>
    {back}
    <CustomerCard key={customer.data.accountId} customer={customer.data} />
  </div>;
}

function CustomerCard({customer}: {customer: CustomerDetail}) {
  const t = useTranslations("customers");
  const locale = useLocale();
  const lock = useLockCustomer(customer.accountId);
  const [lockError, setLockError] = useState<unknown>(null);
  const locked = customer.status === AccountStatus.Locked;
  const date = (value: string) => new Date(value).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US");

  // A refused lock refreshes the customer, and a locked one loses the button and its dialog, so the refusal is shown here.
  const lockCustomer = () => {
    setLockError(null);
    return lock.mutateAsync().catch((error: unknown) => {
      setLockError(error);
      throw error;
    });
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center gap-4">
      <PersonAvatar person={customer} className="size-16 text-xl" />
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-semibold">{customer.fullName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <StatusBadge status={customer.status} label={t(`statuses.${customer.status}`)} />
          {customer.createdAt ? <span>{t("registeredAt", {date: date(customer.createdAt)})}</span> : null}
        </div>
      </div>
      {locked ? null : <ConfirmAction
        title={t("lockTitle")}
        description={t("lockDescription", {name: customer.fullName})}
        confirmLabel={t("lock")}
        cancelLabel={t("cancel")}
        onConfirm={lockCustomer}
        variant="outline"
      ><Lock className="size-4" />{t("lock")}</ConfirmAction>}
    </div>
    {lockError ? <ErrorMessage error={lockError} /> : null}
    {locked ? <p role="status" className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{t("lockedNotice")}</p> : null}

    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>{t("profileTitle")}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>{t("email")}:</strong> {customer.email}</p>
          <p><strong>{t("phone")}:</strong> {customer.phone}</p>
          <p><strong>{t("gender")}:</strong> {t(`genders.${customer.gender}`)}</p>
          <p><strong>{t("birthday")}:</strong> {customer.birthday ? date(customer.birthday) : "—"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("addressesTitle")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {customer.addresses.length ? customer.addresses.map((address) => <div key={address.id} className="rounded-lg border p-3 text-sm">
            <p className="font-medium">{address.recipientName}{address.isDefault ? ` · ${t("defaultAddress")}` : ""}</p>
            <p className="text-muted-foreground">{address.phone} · {address.addressLine}</p>
          </div>) : <p className="text-sm text-muted-foreground">{t("noAddresses")}</p>}
        </CardContent>
      </Card>
    </div>

    <CustomerOrders customerId={customer.accountId} />
  </div>;
}

/** The orders of the customer, newest first, from the same list the shop uses for every order. */
function CustomerOrders({customerId}: {customerId: string}) {
  const t = useTranslations("customers");
  const locale = useLocale();
  const [pageNumber, setPageNumber] = useState(0);
  const orders = useAdminOrders({customerId, page: pageNumber, size: ORDERS_PAGE_SIZE});
  const page = orders.data;

  return <Card>
    <CardHeader>
      <CardTitle>{t("ordersTitle")}</CardTitle>
      <CardDescription>{page ? t("totalOrders", {count: page.totalElements}) : null}</CardDescription>
    </CardHeader>
    <CardContent>
      {orders.isPending ? <Skeleton className="h-24 rounded-xl" /> : orders.isError ? <ErrorMessage error={orders.error} /> : page && page.items.length ? <>
        <ul className="space-y-3">
          {page.items.map((order) => <li key={order.id}>
            <Link href={`/admin/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm transition hover:bg-muted">
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{order.invoiceNumber}</span>
                  <StatusBadge status={order.status} />
                </span>
                <span className="mt-1 block truncate text-muted-foreground">
                  {order.createdAt ? new Date(order.createdAt).toLocaleString(locale === "vi" ? "vi-VN" : "en-US") : "—"}
                  {order.firstProductName ? ` · ${order.firstProductName}${order.itemCount > 1 ? ` ${t("moreItems", {count: order.itemCount - 1})}` : ""}` : ""}
                </span>
              </span>
              <span className="font-semibold">{formatMoney(order.totalAmount, locale)}</span>
            </Link>
          </li>)}
        </ul>
        {page.totalPages > 1 ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{t("pageOf", {page: page.page + 1, total: page.totalPages})}</p>
          <AdminPagination hasPrev={page.page > 0} hasNext={!page.last} onPrev={() => setPageNumber((current) => Math.max(0, current - 1))} onNext={() => setPageNumber((current) => current + 1)} />
        </div> : null}
      </> : <p className="text-sm text-muted-foreground">{t("noOrders")}</p>}
    </CardContent>
  </Card>;
}
