"use client";

import {ChevronDown, ChevronUp, Search} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";

import {AdminPagination} from "@/features/admin/admin-pagination";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusBadge} from "@/components/ui/status-badge";
import {Link} from "@/i18n/navigation";
import {AccountStatus} from "@/lib/domain/account-enums";

import {EmployeeAvatar} from "./components/employee-avatar";
import {EmployeeForm} from "./components/employee-form";
import {emptyEmployeeFormValues, toCreateRequest} from "./employee-form-values";
import {AdminOnly} from "./admin-only";
import {useCreateEmployee, useEmployees} from "./queries";

const PAGE_SIZE = 20;
const STATUSES = Object.values(AccountStatus);

/** Adding, finding and opening the employees. Only the admin manages them. */
export function EmployeesPage() {
  return <AdminOnly><Employees /></AdminOnly>;
}

function Employees() {
  const t = useTranslations("employees");
  const [draft, setDraft] = useState({keyword: "", status: ""});
  const [applied, setApplied] = useState(draft);
  const [pageNumber, setPageNumber] = useState(0);
  const query = useEmployees({page: pageNumber, size: PAGE_SIZE, keyword: applied.keyword || undefined, status: applied.status || undefined});
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

  return <div>
    <div className="mb-8 flex flex-col gap-2 border-b border-border/70 pb-6">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="max-w-3xl text-muted-foreground">{t("description")}</p>
    </div>

    <CreateEmployee />

    <Card className="mb-6">
      <CardContent className="p-4">
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); apply(); }}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" aria-label={t("searchLabel")} value={draft.keyword} placeholder={t("searchPlaceholder")} onChange={(event) => setDraft((current) => ({...current, keyword: event.target.value}))} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="field"><Search className="size-4" />{t("search")}</Button>
              <Button type="button" size="field" variant="outline" onClick={reset}>{t("clearFilters")}</Button>
            </div>
          </div>
          <div className="grid gap-3 border-t pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-muted-foreground">{t("status")}</span>
              <Select id="employee-status-filter" value={draft.status} onChange={(event) => setDraft((current) => ({...current, status: event.target.value}))}>
                <option value="">{t("allStatuses")}</option>
                {STATUSES.map((status) => <option key={status} value={status}>{t(`statuses.${status}`)}</option>)}
              </Select>
            </label>
          </div>
        </form>
      </CardContent>
    </Card>

    {query.isPending ? <Skeleton className="h-64 rounded-2xl" /> : query.isError ? <ErrorMessage error={query.error} /> : <>
      {page && page.items.length ? <ul className="space-y-3">
        {page.items.map((employee) => <li key={employee.accountId}>
          <Link href={`/admin/employees/${employee.accountId}`} className="block">
            <Card className="transition hover:border-primary/30 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                <EmployeeAvatar employee={employee} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{employee.fullName}</p>
                    <StatusBadge status={employee.status} label={t(`statuses.${employee.status}`)} />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{employee.email} · {employee.phone}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>)}
      </ul> : <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">{t("noResults")}</div>}
      {page && page.totalPages > 1 ? <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t("pageOf", {page: page.page + 1, total: page.totalPages})} · {t("totalEmployees", {count: page.totalElements})}</p>
        <AdminPagination hasPrev={page.page > 0} hasNext={!page.last} onPrev={() => setPageNumber((current) => Math.max(0, current - 1))} onNext={() => setPageNumber((current) => current + 1)} />
      </div> : null}
    </>}
  </div>;
}

/** The form to add an employee. It starts again, blank, after each one that is added. */
function CreateEmployee() {
  const t = useTranslations("employees");
  const create = useCreateEmployee();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  return <Card className="mb-6">
    <CardHeader className="flex-row items-center justify-between gap-4">
      <div className="min-w-0">
        <CardTitle>{t("createTitle")}</CardTitle>
        <CardDescription>{t("createDescription")}</CardDescription>
      </div>
      <Button type="button" variant="outline" size="sm" aria-expanded={open} onClick={() => { create.reset(); setOpen((value) => !value); }}>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        {open ? t("hideCreate") : t("openCreate")}
      </Button>
    </CardHeader>
    {added ? <CardContent className="pt-0"><p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700">{t("created", {name: added})}</p></CardContent> : null}
    {open ? <CardContent>
      <EmployeeForm
        key={formKey}
        idPrefix="new-employee"
        initial={emptyEmployeeFormValues()}
        askPassword
        submitLabel={t("create")}
        pending={create.isPending}
        error={create.error}
        onSubmit={(values) => {
          setAdded(null);
          create.mutate(toCreateRequest(values), {
            onSuccess: (employee) => {
              setAdded(employee.fullName);
              setFormKey((current) => current + 1);
            },
          });
        }}
        onCancel={() => { create.reset(); setOpen(false); }}
      />
    </CardContent> : null}
  </Card>;
}
