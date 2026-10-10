"use client";

import {Search} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
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

  return <div>
    <div className="mb-8 flex flex-col gap-2 border-b border-border/70 pb-6">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="max-w-3xl text-muted-foreground">{t("description")}</p>
    </div>

    <Card className="mb-6">
      <CardContent className="p-4">
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); apply(); }}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" aria-label={t("searchLabel")} value={draft.keyword} placeholder={t("searchPlaceholder")} onChange={(event) => set("keyword", event.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="field"><Search className="size-4" />{t("search")}</Button>
              <Button type="button" size="field" variant="outline" onClick={reset}>{t("clearFilters")}</Button>
            </div>
          </div>
          <div className="grid gap-3 border-t pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-muted-foreground">{t("status")}</span>
              <Select id="customer-status-filter" value={draft.status} onChange={(event) => set("status", event.target.value)}>
                <option value="">{t("allStatuses")}</option>
                {CUSTOMER_STATUSES.map((status) => <option key={status} value={status}>{t(`statuses.${status}`)}</option>)}
              </Select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-muted-foreground">{t("fromDate")}</span>
              <Input id="customer-from" type="date" value={draft.fromDate} onChange={(event) => set("fromDate", event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-muted-foreground">{t("toDate")}</span>
              <Input id="customer-to" type="date" value={draft.toDate} onChange={(event) => set("toDate", event.target.value)} />
            </label>
          </div>
          {rangeError ? <p role="alert" className="text-sm text-destructive">{t("rangeError")}</p> : null}
        </form>
      </CardContent>
    </Card>

    {query.isPending ? <Skeleton className="h-64 rounded-2xl" /> : query.isError ? <ErrorMessage error={query.error} /> : <>
      {page && page.items.length ? <ul className="space-y-3">
        {page.items.map((customer) => <li key={customer.accountId}>
          <Link href={`/admin/customers/${customer.accountId}`} className="block">
            <Card className="transition hover:border-primary/30 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                <PersonAvatar person={customer} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{customer.fullName}</p>
                    <StatusBadge status={customer.status} label={t(`statuses.${customer.status}`)} />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{customer.email} · {customer.phone}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>)}
      </ul> : <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">{t("noResults")}</div>}
      {page && page.totalPages > 1 ? <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t("pageOf", {page: page.page + 1, total: page.totalPages})} · {t("totalCustomers", {count: page.totalElements})}</p>
        <AdminPagination hasPrev={page.page > 0} hasNext={!page.last} onPrev={() => setPageNumber((current) => Math.max(0, current - 1))} onNext={() => setPageNumber((current) => current + 1)} />
      </div> : null}
    </>}
  </div>;
}
