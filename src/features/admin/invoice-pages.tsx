"use client";

import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Link} from "@/i18n/navigation";
import {formatMoney} from "@/lib/format";
import {AdminPagination} from "./admin-pagination";
import {useAdminInvoice, useAdminInvoices} from "@/features/orders/queries";
import {BackLink, Loading, Failure, SummaryLine} from "./detail-kit";

export function AdminInvoicesPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [draft, setDraft] = useState({keyword: "", fromDate: "", toDate: ""});
  const [applied, setApplied] = useState(draft);
  const [pageNumber, setPageNumber] = useState(0);
  const invoices = useAdminInvoices({
    page: pageNumber,
    size: 20,
    keyword: applied.keyword || undefined,
    invoiceFrom: applied.fromDate ? `${applied.fromDate}T00:00:00Z` : undefined,
    invoiceTo: applied.toDate ? `${applied.toDate}T23:59:59Z` : undefined,
  });
  const reset = () => {
    const empty = {keyword: "", fromDate: "", toDate: ""};
    setDraft(empty);
    setApplied(empty);
    setPageNumber(0);
  };
  const page = invoices.data;
  return (
    <div>
      <div className="mb-8 border-b border-border/70 pb-6">
        <p className="eyebrow">{t("label")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t("invoices")}</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">{t("resource.invoicesDescription")}</p>
      </div>
      <Card className="mb-6">
        <CardContent className="p-4">
          <form
            className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_10rem_auto_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              setApplied({...draft, keyword: draft.keyword.trim()});
              setPageNumber(0);
            }}
          >
            <Input
              value={draft.keyword}
              onChange={(event) => setDraft((current) => ({...current, keyword: event.target.value}))}
              placeholder={t("searchInvoices")}
            />
            <Input
              aria-label={t("fromDate")}
              type="date"
              value={draft.fromDate}
              onChange={(event) => setDraft((current) => ({...current, fromDate: event.target.value}))}
            />
            <Input
              aria-label={t("toDate")}
              type="date"
              value={draft.toDate}
              onChange={(event) => setDraft((current) => ({...current, toDate: event.target.value}))}
            />
            <Button type="submit" size="field">
              {t("search")}
            </Button>
            <Button type="button" size="field" variant="outline" onClick={reset}>
              {t("clearFilters")}
            </Button>
          </form>
        </CardContent>
      </Card>
      {invoices.isPending ? (
        <Loading />
      ) : invoices.isError ? (
        <Failure error={invoices.error} />
      ) : (
        <>
          {(page?.items ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">{t("noResults")}</div>
          ) : (
            <div className="space-y-3">
              {(page?.items ?? []).map((invoice) => (
                <Card key={invoice.id} className="transition hover:border-primary/30 hover:shadow-md">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                    <div className="min-w-0">
                      <Link href={`/admin/invoices/${invoice.id}`} className="font-semibold hover:text-primary hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {invoice.recipientName ?? "—"} ·{" "}
                        {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US") : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{formatMoney(invoice.totalAmount, locale)}</span>
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        {t("view")}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {page && page.totalPages > 1 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t("pageOf", {page: page.page + 1, total: page.totalPages})}
                {" · "}
                {t("totalInvoices", {count: page.totalElements})}
              </p>
              <AdminPagination page={page.page} totalPages={page.totalPages} onPageChange={setPageNumber} />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export function AdminInvoiceDetailPage({orderId}: {orderId: string}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const invoice = useAdminInvoice(orderId);
  if (invoice.isPending) return <Loading />;
  if (invoice.isError || !invoice.data)
    return (
      <>
        <BackLink href="/admin/invoices">{t("back")}</BackLink>
        <Failure error={invoice.error} />
      </>
    );
  const item = invoice.data;
  return (
    <div>
      <BackLink href="/admin/invoices">{t("back")}</BackLink>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("invoiceDetail")}</p>
          <h1 className="mt-2 text-3xl font-semibold">{item.invoiceNumber}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {item.invoiceDate ? new Date(item.invoiceDate).toLocaleString(locale === "vi" ? "vi-VN" : "en-US") : "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/orders/${item.id}`}
            className="inline-flex h-9 items-center rounded-lg border bg-background px-3 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
          >
            {t("viewOrder")}
          </Link>
          <Button type="button" size="sm" variant="outline" onClick={() => window.print()}>
            {t("printInvoice")}
          </Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>{t("items")}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {item.items.map((line) => (
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
                <span className="shrink-0 font-semibold">{formatMoney(line.lineTotal, locale)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("deliverySnapshot")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{item.recipientName ?? "—"}</p>
              <p>{item.recipientPhone}</p>
              <p className="leading-6 text-muted-foreground">{item.deliveryAddress}</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
