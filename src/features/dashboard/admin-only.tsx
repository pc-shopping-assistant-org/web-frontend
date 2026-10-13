"use client";

import {useTranslations} from "next-intl";
import type {ReactNode} from "react";

import {RoleGate} from "@/features/auth/role-gate";
import {isAdminRole} from "@/lib/auth/roles";

/** The figures are the admin's: the backend refuses the employee on them. */
export function AdminOnly({children}: {children: ReactNode}) {
  const t = useTranslations("dashboard");
  return <RoleGate allowed={isAdminRole} title={t("adminOnlyTitle")} description={t("adminOnlyDescription")}>{children}</RoleGate>;
}
