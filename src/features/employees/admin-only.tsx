"use client";

import {useTranslations} from "next-intl";
import type {ReactNode} from "react";

import {RoleGate} from "@/features/auth/role-gate";
import {isAdminRole} from "@/lib/auth/roles";

/** The employees are the admin's alone. */
export function AdminOnly({children}: {children: ReactNode}) {
  const t = useTranslations("employees");
  return (
    <RoleGate allowed={isAdminRole} title={t("adminOnlyTitle")} description={t("adminOnlyDescription")}>
      {children}
    </RoleGate>
  );
}
