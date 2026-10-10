"use client";

import {ArrowLeft, Lock, Power, PowerOff, Trash2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState, type ReactNode} from "react";

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ConfirmAction} from "@/components/ui/confirm-action";
import {ErrorMessage} from "@/components/ui/error-message";
import {Skeleton} from "@/components/ui/skeleton";
import {PersonAvatar} from "@/components/ui/person-avatar";
import {StatusBadge} from "@/components/ui/status-badge";
import {Link} from "@/i18n/navigation";
import {AccountStatus} from "@/lib/domain/account-enums";

import {AdminOnly} from "./admin-only";
import {EmployeeForm} from "./components/employee-form";
import {employeeFormValues, toUpdateRequest} from "./employee-form-values";
import type {Employee} from "./models";
import {useEmployee, useEmployeeState, useLockEmployee, useUpdateEmployee} from "./queries";

/** One employee: the details to edit, and the moves between states. Only the admin manages them. */
export function EmployeeDetailPage({employeeId}: {employeeId: string}) {
  return <AdminOnly><EmployeeDetail employeeId={employeeId} /></AdminOnly>;
}

function EmployeeDetail({employeeId}: {employeeId: string}) {
  const t = useTranslations("employees");
  const employee = useEmployee(employeeId);
  const back = <Link href="/admin/employees" className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{t("back")}</Link>;

  if (employee.isPending) return <Skeleton className="h-96 rounded-2xl" />;
  if (employee.isError) return <>{back}<ErrorMessage error={employee.error} /></>;
  return <div>
    {back}
    <EmployeeCard key={employee.data.accountId} employee={employee.data} />
  </div>;
}

type StateAction = "deactivate" | "activate" | "lock" | "delete";

function EmployeeCard({employee}: {employee: Employee}) {
  const t = useTranslations("employees");
  const locale = useLocale();
  const update = useUpdateEmployee(employee.accountId);
  const lock = useLockEmployee(employee.accountId);
  const state = useEmployeeState(employee.accountId);
  const [notice, setNotice] = useState<"saved" | "unchanged" | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const {Active, Inactive, Locked, Deleted} = AccountStatus;
  const status = employee.status;

  // A refused move refreshes the employee, which then loses the button and its dialog, so the refusal is shown here.
  const action = (key: StateAction, icon: ReactNode, perform: () => Promise<unknown>) => <ConfirmAction
    key={key}
    title={t(`${key}Title`)}
    description={t(`${key}Description`, {name: employee.fullName})}
    confirmLabel={t(key)}
    cancelLabel={t("cancel")}
    onConfirm={() => {
      setActionError(null);
      return perform().catch((error: unknown) => {
        setActionError(error);
        throw error;
      });
    }}
    variant="outline"
    confirmVariant={key === "activate" ? "default" : "destructive"}
  >{icon}{t(key)}</ConfirmAction>;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center gap-4">
      <PersonAvatar person={employee} className="size-16 text-xl" />
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-semibold">{employee.fullName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <StatusBadge status={status} label={t(`statuses.${status}`)} />
          {employee.createdAt ? <span>{t("createdAt", {date: new Date(employee.createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")})}</span> : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {status === Active ? action("deactivate", <PowerOff className="size-4" />, state.deactivate.mutateAsync) : null}
        {status === Inactive ? action("activate", <Power className="size-4" />, state.activate.mutateAsync) : null}
        {status === Active || status === Inactive ? action("lock", <Lock className="size-4" />, lock.mutateAsync) : null}
        {status !== Deleted ? action("delete", <Trash2 className="size-4" />, state.remove.mutateAsync) : null}
      </div>
    </div>
    {actionError ? <ErrorMessage error={actionError} /> : null}
    {status === Locked || status === Inactive || status === Deleted
      ? <p role="status" className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{t(`notices.${status}`)}</p>
      : null}

    {status === Deleted ? null : <Card>
      <CardHeader>
        <CardTitle>{t("editTitle")}</CardTitle>
        <CardDescription>{t("editDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <EmployeeForm
          idPrefix="employee"
          initial={employeeFormValues(employee)}
          askPassword={false}
          submitLabel={t("save")}
          pending={update.isPending}
          error={update.error}
          onSubmit={(values) => {
            setNotice(null);
            const request = toUpdateRequest(values, employee);
            if (!Object.keys(request).length) {
              update.reset();
              setNotice("unchanged");
              return;
            }
            update.mutate(request, {onSuccess: () => setNotice("saved")});
          }}
        />
        {notice ? <p role="status" className={`mt-4 text-sm ${notice === "saved" ? "text-emerald-700" : "text-muted-foreground"}`}>{t(notice)}</p> : null}
      </CardContent>
    </Card>}
  </div>;
}
