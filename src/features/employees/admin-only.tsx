"use client";

import {ShieldAlert} from "lucide-react";
import {useTranslations} from "next-intl";
import type {ReactNode} from "react";

import {ErrorMessage} from "@/components/ui/error-message";
import {Skeleton} from "@/components/ui/skeleton";
import {useProfile} from "@/features/auth/queries";
import {isAdminRole} from "@/lib/auth/roles";

/**
 * The page is the admin's alone. The backend refuses the others anyway; this keeps an employee who types the address
 * from seeing a page of errors, and keeps the page from asking the backend at all.
 */
export function AdminOnly({children}: {children: ReactNode}) {
  const t = useTranslations("employees");
  const profile = useProfile();
  if (profile.isPending) return <Skeleton className="h-64 rounded-2xl" />;
  if (profile.isError) return <ErrorMessage error={profile.error} />;
  if (!isAdminRole(profile.data.role)) {
    return <div className="rounded-2xl border border-dashed p-12 text-center">
      <ShieldAlert className="mx-auto size-10 text-destructive" />
      <h1 className="mt-4 text-2xl font-semibold">{t("adminOnlyTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("adminOnlyDescription")}</p>
    </div>;
  }
  return <>{children}</>;
}
