"use client";

import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";

import {Card} from "@/components/ui/card";
import {ConfirmAction} from "@/components/ui/confirm-action";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusBadge} from "@/components/ui/status-badge";
import type {AdminPayment, AdminPaymentMethod} from "@/features/payments/models";
import {useAdminPaymentMethods, useAdminPayments, useUpdateAdminPaymentStatus} from "@/features/payments/queries";
import {Link} from "@/i18n/navigation";
import {PaymentMethodCode, PaymentStatus} from "@/lib/domain/commerce-enums";
import {formatMoney} from "@/lib/format";

import {AdminPagination} from "./admin-pagination";
import {DataTable, EmptyBox, FilterField, FilterPanel, ListFooter, PageHeader, StatusTabs, dateParam, shortId} from "./list-kit";

const PAGE_SIZE = 20;
const EMPTY_FILTERS = {transactionCode: "", customerName: "", fromDate: "", toDate: ""};

/** The payments of the shop: tabs by status, a search by transaction, customer and day, and the two changes the shop can make. */
export function PaymentListPage() {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.paymentList");
  const locale = useLocale();
  const methods = useAdminPaymentMethods();
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [pageNumber, setPageNumber] = useState(0);
  const [actionError, setActionError] = useState<unknown>(null);
  const [rangeError, setRangeError] = useState(false);
  const query = useAdminPayments({
    page: pageNumber,
    size: PAGE_SIZE,
    transactionCode: applied.transactionCode || undefined,
    customerName: applied.customerName || undefined,
    status: status || undefined,
    createdFrom: dateParam(applied.fromDate, false),
    createdTo: dateParam(applied.toDate, true),
  });
  const page = query.data;
  const items = page?.items ?? [];
  const filtered = Boolean(status || applied.transactionCode || applied.customerName || applied.fromDate || applied.toDate);
  const set = (key: keyof typeof EMPTY_FILTERS, value: string) => setDraft((current) => ({...current, [key]: value}));

  const search = () => {
    if (draft.fromDate && draft.toDate && draft.fromDate > draft.toDate) {
      setRangeError(true);
      return;
    }
    setRangeError(false);
    setApplied({...draft, transactionCode: draft.transactionCode.trim(), customerName: draft.customerName.trim()});
    setPageNumber(0);
    setActionError(null);
  };
  const reset = () => {
    setRangeError(false);
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setStatus("");
    setPageNumber(0);
    setActionError(null);
  };
  const go = (next: number) => {
    setPageNumber(Math.max(0, next));
    setActionError(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t("resource.payments")} description={t("resource.paymentsDescription")} />

      <StatusTabs
        label={t("status")}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPageNumber(0);
          setActionError(null);
        }}
        tabs={[{value: "", label: tl("all")}, ...Object.values(PaymentStatus).map((value) => ({value, label: t(`statusValues.${value}`)}))]}
      />

      <FilterPanel
        onSubmit={search}
        onReset={reset}
        error={rangeError ? tl("rangeError") : undefined}
        className="xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_11rem_11rem]"
      >
        <FilterField label={tl("transaction")}>
          <Input
            aria-label={t("searchPayments")}
            placeholder={t("searchPayments")}
            value={draft.transactionCode}
            onChange={(event) => set("transactionCode", event.target.value)}
          />
        </FilterField>
        <FilterField label={t("customerName")}>
          <Input value={draft.customerName} onChange={(event) => set("customerName", event.target.value)} />
        </FilterField>
        <FilterField label={t("fromDate")}>
          <Input type="date" value={draft.fromDate} onChange={(event) => set("fromDate", event.target.value)} />
        </FilterField>
        <FilterField label={t("toDate")}>
          <Input type="date" value={draft.toDate} onChange={(event) => set("toDate", event.target.value)} />
        </FilterField>
      </FilterPanel>

      <Card className="p-4 sm:p-5">
        {actionError ? (
          <div className="mb-4">
            <ErrorMessage error={actionError} />
          </div>
        ) : null}
        {query.isPending ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : query.isError ? (
          <ErrorMessage error={query.error} />
        ) : items.length === 0 ? (
          <EmptyBox>{filtered ? tl("emptyFiltered") : tl("empty")}</EmptyBox>
        ) : (
          <DataTable
            minWidth="58rem"
            columns={[
              {key: "transaction", label: tl("transaction")},
              {key: "order", label: tl("order")},
              {key: "method", label: tl("method")},
              {key: "amount", label: tl("amount"), className: "text-right"},
              {key: "time", label: tl("time")},
              {key: "status", label: t("status")},
              {key: "actions", label: tl("actions")},
            ]}
          >
            {items.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                locale={locale}
                method={methods.data?.find((method) => method.id === payment.paymentMethodId)}
                onError={setActionError}
              />
            ))}
          </DataTable>
        )}
        {page && items.length > 0 ? (
          <ListFooter
            summary={
              <>
                {t("totalPayments", {count: page.totalElements})}
                {page.totalPages > 1 ? ` · ${t("pageOf", {page: page.page + 1, total: page.totalPages})}` : ""}
              </>
            }
            pager={
              page.totalPages > 1 ? (
                <AdminPagination page={page.page} totalPages={page.totalPages} onPageChange={go} />
              ) : undefined
            }
          />
        ) : null}
      </Card>
    </div>
  );
}

/**
 * The two changes the shop can make: cash collected on delivery, and a paid payment given back.
 * A refused change refreshes the row, which then loses its button and its dialog, so the refusal goes to the page.
 */
function PaymentRow({
  payment,
  locale,
  method,
  onError,
}: {
  payment: AdminPayment;
  locale: string;
  method?: AdminPaymentMethod;
  onError: (error: unknown) => void;
}) {
  const t = useTranslations("admin");
  const mutation = useUpdateAdminPaymentStatus();
  const change = (status: PaymentStatus) => {
    onError(null);
    return mutation.mutateAsync({paymentId: payment.id, status}).catch((error: unknown) => {
      onError(error);
      throw error;
    });
  };
  const dateTime = (value: string) =>
    new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {dateStyle: "short", timeStyle: "short"}).format(new Date(value));
  const canCollect = payment.status === PaymentStatus.Pending && method?.code === PaymentMethodCode.Cod;
  const canRefund = payment.status === PaymentStatus.Paid;
  const when = payment.paidAt ?? payment.createdAt;

  return (
    <tr className="border-t align-top transition hover:bg-muted/20">
      <td className="px-4 py-3">
        <p className="font-medium">{payment.providerTransactionCode ?? shortId(payment.id)}</p>
        {payment.customerId ? <p className="mt-0.5 text-xs text-muted-foreground">{shortId(payment.customerId)}</p> : null}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <Link href={`/admin/orders/${payment.orderId}`} className="font-medium hover:text-primary hover:underline">
          {shortId(payment.orderId)}
        </Link>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{method?.name ?? "—"}</td>
      <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{formatMoney(payment.amount, locale)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        <p>{when ? dateTime(when) : "—"}</p>
        {payment.paidAt ? <p className="mt-0.5 text-xs">{t("paidAt")}</p> : null}
        {payment.updatedBy ? <p className="mt-0.5 text-xs">{t("changedByStaff")}</p> : null}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={payment.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {canCollect ? (
            <ConfirmAction
              title={t("collectCash")}
              description={t("collectCashDescription")}
              confirmLabel={t("collectCash")}
              cancelLabel={t("cancel")}
              onConfirm={() => change(PaymentStatus.Paid)}
              variant="link"
              size="xs"
              confirmVariant="default"
              className="h-auto p-0 text-sm font-medium"
            >
              {t("collectCash")}
            </ConfirmAction>
          ) : null}
          {canRefund ? (
            <ConfirmAction
              title={t("refundPayment")}
              description={t("refundPaymentDescription")}
              confirmLabel={t("refundPayment")}
              cancelLabel={t("cancel")}
              onConfirm={() => change(PaymentStatus.Refunded)}
              variant="link"
              size="xs"
              className="h-auto p-0 text-sm font-medium text-destructive"
            >
              {t("refundPayment")}
            </ConfirmAction>
          ) : null}
          {!canCollect && !canRefund ? <span className="text-muted-foreground">—</span> : null}
        </div>
      </td>
    </tr>
  );
}
