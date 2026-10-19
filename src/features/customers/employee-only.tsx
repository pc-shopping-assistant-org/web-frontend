"use client";

import {useTranslations} from "next-intl";
import type {ReactNode} from "react";

import {RoleGate} from "@/features/auth/role-gate";
import {isEmployeeRole} from "@/lib/auth/roles";

/** The customers are the employee's: the backend refuses the admin on them. */
export function EmployeeOnly({children}: {children: ReactNode}) {
  const t = useTranslations("customers");
  return (
    <RoleGate allowed={isEmployeeRole} title={t("employeeOnlyTitle")} description={t("employeeOnlyDescription")}>
      {children}
    </RoleGate>
  );
}
