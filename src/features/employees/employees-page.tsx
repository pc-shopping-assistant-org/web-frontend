"use client";

import {Plus, Search} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";

import {AdminPagination} from "@/features/admin/admin-pagination";
import {Button, buttonVariants} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Skeleton} from "@/components/ui/skeleton";
import {PersonAvatar} from "@/components/ui/person-avatar";
import {StatusBadge} from "@/components/ui/status-badge";
import {Link} from "@/i18n/navigation";
import {AccountStatus} from "@/lib/domain/account-enums";

import {AdminOnly} from "./admin-only";
import {useEmployees} from "./queries";

const PAGE_SIZE = 20;
const STATUSES = Object.values(AccountStatus);

/** Finding and opening the employees, with the way to add one. Only the admin manages them. */
export function EmployeesPage() {
  return (
    <AdminOnly>
      <Employees />
    </AdminOnly>
  );
}

function Employees() {
  const t = useTranslations("employees");
  const [draft, setDraft] = useState({keyword: "", status: ""});
  const [applied, setApplied] = useState(draft);
  const [pageNumber, setPageNumber] = useState(0);
  const query = useEmployees({
    page: pageNumber,
    size: PAGE_SIZE,
    keyword: applied.keyword || undefined,
    status: applied.status || undefined,
  });
  const page = query.data;

  const apply = () => {
    setApplied({...draft, keyword: draft.keyword.trim()});
    setPageNumber(0);
  };
  const reset = () => {
    const empty = {keyword: "", status: ""};
    setDraft(empty);
    setApplied(empty);
    setPageNumber(0);
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-6">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="max-w-3xl text-muted-foreground">{t("description")}</p>
        </div>
        <Link href="/admin/employees/new" className={buttonVariants({size: "lg"})}>
          <Plus className="size-4" />
          {t("create")}
        </Link>
      </div>

      <Card className="mb-6 p-4 sm:p-5">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
        >
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem]">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                aria-label={t("searchLabel")}
                value={draft.keyword}
                placeholder={t("searchPlaceholder")}
                onChange={(event) => setDraft((current) => ({...current, keyword: event.target.value}))}
              />
            </div>
            <Select
              id="employee-status-filter"
              aria-label={t("status")}
              value={draft.status}
              onChange={(event) => setDraft((current) => ({...current, status: event.target.value}))}
            >
              <option value="">{t("allStatuses")}</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`statuses.${status}`)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit">
              <Search className="size-4" />
              {t("search")}
            </Button>
            <Button type="button" variant="outline" onClick={reset}>
              {t("clearFilters")}
            </Button>
          </div>
        </form>
      </Card>

      {query.isPending ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : query.isError ? (
        <ErrorMessage error={query.error} />
      ) : (
        <>
          {page && page.items.length ? (
            <ul className="space-y-3">
              {page.items.map((employee) => (
                <li key={employee.accountId}>
                  <Link href={`/admin/employees/${employee.accountId}`} className="block">
                    <Card className="transition hover:border-primary/30 hover:shadow-md">
                      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                        <PersonAvatar person={employee} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{employee.fullName}</p>
                            <StatusBadge status={employee.status} label={t(`statuses.${employee.status}`)} />
                          </div>
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {employee.email} · {employee.phone}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">{t("noResults")}</div>
          )}
          {page && page.totalPages > 1 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t("pageOf", {page: page.page + 1, total: page.totalPages})} · {t("totalEmployees", {count: page.totalElements})}
              </p>
              <AdminPagination page={page.page} totalPages={page.totalPages} onPageChange={setPageNumber} />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
