"use client";

import {Boxes, ChevronRight, CreditCard, FileText, LayoutDashboard, Package, Percent, ShieldAlert, Store, Tags, Truck, Users} from "lucide-react";
import {useTranslations} from "next-intl";
import type {ReactNode} from "react";

import {ErrorMessage} from "@/components/ui/error-message";
import {Link, usePathname} from "@/i18n/navigation";
import {useProfile} from "@/features/auth/queries";
import {cn} from "@/lib/utils";

const nav = [
  {key: "dashboard", href: "/admin", icon: LayoutDashboard},
  {key: "products", href: "/admin/products", icon: Package},
  {key: "categories", href: "/admin/categories", icon: Tags},
  {key: "brands", href: "/admin/brands", icon: Tags},
  {key: "orders", href: "/admin/orders", icon: Boxes},
  {key: "invoices", href: "/admin/invoices", icon: FileText},
  {key: "customers", href: "/admin/customers", icon: Users},
  {key: "employees", href: "/admin/employees", icon: ShieldAlert},
  {key: "discounts", href: "/admin/discounts", icon: Percent},
  {key: "suppliers", href: "/admin/suppliers", icon: Truck},
  {key: "payments", href: "/admin/payments", icon: CreditCard},
  {key: "paymentMethods", href: "/admin/payment-methods", icon: Store},
  {key: "reviews", href: "/admin/reviews", icon: ShieldAlert},
] as const;

export function AdminShell({children}: {children: ReactNode}) {
  const t = useTranslations("admin");
  const profile = useProfile();
  const pathname = usePathname();
  if (profile.isPending) return <div className="page-wrap py-16"><div className="h-96 animate-pulse rounded-2xl bg-muted" /></div>;
  if (profile.isError) return <div className="page-wrap py-16"><ErrorMessage error={profile.error} /></div>;
  const role = profile.data.role?.toUpperCase();
  if (!role || !["ROLE_ADMIN", "ROLE_EMPLOYEE", "ROLE_MANAGER", "ADMIN", "EMPLOYEE", "MANAGER"].includes(role)) return <div className="page-wrap py-16"><div className="rounded-2xl border border-dashed p-12 text-center"><ShieldAlert className="mx-auto size-10 text-destructive" /><h1 className="mt-4 text-2xl font-semibold">{t("forbiddenTitle")}</h1><p className="mt-2 text-muted-foreground">{t("forbiddenDescription")}</p></div></div>;
  return <div className="page-wrap grid gap-8 py-8 lg:grid-cols-[15rem_1fr]"><aside className="h-fit rounded-2xl border bg-card p-3 lg:sticky lg:top-24"><div className="mb-3 px-3 py-2"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("label")}</p><p className="mt-1 font-semibold">{profile.data.fullName}</p></div><nav className="space-y-1">{nav.map(({key, href, icon: Icon}) => <Link key={key} href={href} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground", pathname === href && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")}><Icon className="size-4" />{t(`nav.${key}`)}<ChevronRight className="ml-auto size-3 opacity-50" /></Link>)}</nav></aside><main className="min-w-0">{children}</main></div>;
}
