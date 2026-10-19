"use client";

import {ShieldAlert} from "lucide-react";
import type {ReactNode} from "react";

import {ErrorMessage} from "@/components/ui/error-message";
import {Skeleton} from "@/components/ui/skeleton";

import {useProfile} from "./queries";

/**
 * A page for one role only. The backend refuses the others anyway; this keeps someone who types the address
 * from seeing a page of errors, and keeps the page from asking the backend at all.
 */
export function RoleGate({
  allowed,
  title,
  description,
  children,
}: {
  allowed: (role: string | undefined) => boolean;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const profile = useProfile();
  if (profile.isPending) return <Skeleton className="h-64 rounded-2xl" />;
  if (profile.isError) return <ErrorMessage error={profile.error} />;
  if (!allowed(profile.data.role)) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center">
        <ShieldAlert className="mx-auto size-10 text-destructive" />
        <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
    );
  }
  return <>{children}</>;
}
