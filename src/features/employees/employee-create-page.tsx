"use client";

import {ArrowLeft} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import {Link, useRouter} from "@/i18n/navigation";

import {AdminOnly} from "./admin-only";
import {EmployeeForm} from "./components/employee-form";
import {emptyEmployeeFormValues, toCreateRequest} from "./employee-form-values";
import {useCreateEmployee} from "./queries";

/** Adding an employee on a page of its own; the new employee's page opens once it is saved. Only the admin manages them. */
export function EmployeeCreatePage() {
  return (
    <AdminOnly>
      <CreateEmployee />
    </AdminOnly>
  );
}

function CreateEmployee() {
  const t = useTranslations("employees");
  const router = useRouter();
  const create = useCreateEmployee();

  return (
    <div>
      <Link href="/admin/employees" className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <div className="mb-8 flex flex-col gap-2 border-b border-border/70 pb-6">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("createTitle")}</h1>
        <p className="max-w-3xl text-muted-foreground">{t("createDescription")}</p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <EmployeeForm
            idPrefix="new-employee"
            initial={emptyEmployeeFormValues()}
            askPassword
            submitLabel={t("create")}
            pending={create.isPending}
            error={create.error}
            onSubmit={(values) =>
              create.mutate(toCreateRequest(values), {onSuccess: (employee) => router.push(`/admin/employees/${employee.accountId}`)})
            }
            onCancel={() => router.push("/admin/employees")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
