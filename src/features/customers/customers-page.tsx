"use client";

import {Search} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {PersonAvatar} from "@/components/ui/person-avatar";
import {Select} from "@/components/ui/select";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusBadge} from "@/components/ui/status-badge";
import {AdminPagination} from "@/features/admin/admin-pagination";
import {Link} from "@/i18n/navigation";
import {AccountStatus} from "@/lib/domain/account-enums";

import {EmployeeOnly} from "./employee-only";
import {useCustomers} from "./queries";

const PAGE_SIZE = 20;
/** A customer registers active and is locked by the shop; the other two states are listed for the filter of the backend. */
export const CUSTOMER_STATUSES = [AccountStatus.Active, AccountStatus.Inactive, AccountStatus.Locked] as const;

const EMPTY_FILTERS = {keyword: "", status: "", fromDate: "", toDate: ""};

/** A day typed in the filter becomes the start or the end of that day. */
const startOfDay = (value: string) => value ? `${value}T00:00:00Z` : undefined;
const endOfDay = (value: string) => value ? `${value}T23:59:59Z` : undefined;

/** Finding and opening the customers. Only the employee runs them. */
export function CustomersPage() {
  return <EmployeeOnly><Customers /></EmployeeOnly>;
}

function Customers() {
  const t = useTranslations("customers");
  const locale = useLocale();
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [pageNumber, setPageNumber] = useState(0);
  const [rangeError, setRangeError] = useState(false);
  const query = useCustomers({
    page: pageNumber,
    size: PAGE_SIZE,
    keyword: applied.keyword || undefined,
    status: applied.status || undefined,
    createdFrom: startOfDay(applied.fromDate),
    createdTo: endOfDay(applied.toDate),
  });
  const page = query.data;
  const set = (key: keyof typeof EMPTY_FILTERS, value: string) => setDraft((current) => ({...current, [key]: value}));

  const apply = () => {
    // The backend refuses a range that ends before it starts, so it is not asked
    if (draft.fromDate && draft.toDate && draft.fromDate > draft.toDate) {
      setRangeError(true);
      return;
    }
    setRangeError(false);
    setApplied({...draft, keyword: draft.keyword.trim()});
    setPageNumber(0);
  };
  const reset = () => {
    setRangeError(false);
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPageNumber(0);
  };

  const dateFormat = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {day: "2-digit", month: "2-digit", year: "numeric"});
  const filtered = Boolean(applied.keyword || applied.status || applied.fromDate || applied.toDate);

  return <div className="space-y-5">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
    </div>

    <Card className="p-4 sm:p-5">
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); apply(); }}>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem] xl:grid-cols-[minmax(0,1fr)_12rem_10rem_10rem]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" aria-label={t("searchLabel")} value={draft.keyword} placeholder={t("searchPlaceholder")} onChange={(event) => set("keyword", event.target.value)} />
          </div>
          <Select id="customer-status-filter" aria-label={t("status")} value={draft.status} onChange={(event) => set("status", event.target.value)}>
            <option value="">{t("allStatuses")}</option>
            {CUSTOMER_STATUSES.map((status) => <option key={status} value={status}>{t(`statuses.${status}`)}</option>)}
          </Select>
          <Input id="customer-from" type="date" aria-label={t("fromDate")} title={t("fromDate")} value={draft.fromDate} onChange={(event) => set("fromDate", event.target.value)} />
          <Input id="customer-to" type="date" aria-label={t("toDate")} title={t("toDate")} value={draft.toDate} onChange={(event) => set("toDate", event.target.value)} />
        </div>
        {rangeError ? <p role="alert" className="text-sm text-destructive">{t("rangeError")}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit"><Search className="size-4" />{t("search")}</Button>
          <Button type="button" variant="outline" onClick={reset}>{t("clearFilters")}</Button>
        </div>
      </form>
    </Card>

    <Card className="p-4 sm:p-5">
      {query.isPending ? <Skeleton className="h-64 rounded-xl" /> : query.isError ? <ErrorMessage error={query.error} /> : page && page.items.length ? <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">{t("columnCustomer")}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t("phone")}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t("status")}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t("columnRegistered")}</th>
              <th scope="col" className="relative px-4 py-3 font-medium"><span className="sr-only">{t("view")}</span></th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((customer) => <tr key={customer.accountId} className="border-t transition hover:bg-muted/20">
              <td className="px-4 py-3">
                <Link href={`/admin/customers/${customer.accountId}`} className="group flex min-w-0 items-center gap-3">
                  <PersonAvatar person={customer} className="size-10" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium group-hover:text-primary group-hover:underline">{customer.fullName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{customer.email}</span>
                  </span>
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.phone || "—"}</td>
              <td className="px-4 py-3"><StatusBadge status={customer.status} label={t(`statuses.${customer.status}`)} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.createdAt ? dateFormat.format(new Date(customer.createdAt)) : "—"}</td>
              <td className="px-4 py-3 text-right">
                <Link href={`/admin/customers/${customer.accountId}`} className="text-sm font-medium text-primary hover:underline">{t("view")}</Link>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div> : <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">{filtered ? t("noResults") : t("empty")}</div>}
      {page && page.items.length ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t("totalCustomers", {count: page.totalElements})}{page.totalPages > 1 ? ` · ${t("pageOf", {page: page.page + 1, total: page.totalPages})}` : ""}</p>
        {page.totalPages > 1 ? <AdminPagination hasPrev={page.page > 0} hasNext={!page.last} onPrev={() => setPageNumber((current) => Math.max(0, current - 1))} onNext={() => setPageNumber((current) => current + 1)} /> : null}
      </div> : null}
    </Card>
  </div>;
}
