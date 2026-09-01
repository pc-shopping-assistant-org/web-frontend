"use client";

import {
  Bot,
  BadgePercent,
  Boxes,
  Building2,
  ChartColumnBig,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  ExternalLink,
  FileText,
  FolderTree,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquareQuote,
  Package,
  ShieldAlert,
  SlidersHorizontal,
  Truck,
  Users,
  UserCog,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { ErrorMessage } from "@/components/ui/error-message";
import { AdminPageSkeleton } from "@/components/ui/loading-skeletons";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useLogout, useProfile } from "@/features/auth/queries";
import { isStaffRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "navGroups.overview",
    items: [
      { key: "dashboard", href: "/admin", icon: LayoutDashboard },
      { key: "statistics", href: "/admin/statistics", icon: ChartColumnBig },
    ],
  },
  {
    label: "navGroups.tools",
    items: [{ key: "aiAssistant", href: "/assistant", icon: Bot }],
  },
  {
    label: "navGroups.orders",
    items: [
      { key: "orders", href: "/admin/orders", icon: Boxes },
      { key: "invoices", href: "/admin/invoices", icon: FileText },
    ],
  },
  {
    label: "navGroups.catalog",
    items: [
      { key: "products", href: "/admin/products", icon: Package },
      { key: "categories", href: "/admin/categories", icon: FolderTree },
      { key: "brands", href: "/admin/brands", icon: Building2 },
      { key: "discounts", href: "/admin/discounts", icon: BadgePercent },
      {
        key: "catalogSettings",
        href: "/admin/options",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    label: "navGroups.payments",
    items: [
      { key: "payments", href: "/admin/payments", icon: CreditCard },
      {
        key: "paymentMethods",
        href: "/admin/payment-methods",
        icon: CircleDollarSign,
      },
    ],
  },
  {
    label: "navGroups.management",
    items: [
      { key: "customers", href: "/admin/customers", icon: Users },
      { key: "employees", href: "/admin/employees", icon: UserCog },
      { key: "suppliers", href: "/admin/suppliers", icon: Truck },
      { key: "reviews", href: "/admin/reviews", icon: MessageSquareQuote },
    ],
  },
] as const;

type AdminNavItem = { key: string; href: string; icon: LucideIcon };

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("admin");
  const profile = useProfile();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (profile.isPending) return <AdminPageSkeleton />;
  if (profile.isError)
    return (
      <div className="page-wrap py-16">
        <ErrorMessage error={profile.error} />
      </div>
    );

  const role = profile.data.role?.trim().toUpperCase() ?? "STAFF";
  if (!isStaffRole(role)) {
    return (
      <div className="page-wrap py-16">
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-2xl font-semibold">{t("forbiddenTitle")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("forbiddenDescription")}
          </p>
        </div>
      </div>
    );
  }

  const displayName = profile.data.fullName ?? profile.data.email ?? t("label");
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "A";

  async function signOut() {
    try {
      await logout.mutateAsync();
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  function isActive(href: string) {
    return href === "/admin" ? pathname === href : pathname.startsWith(href);
  }

  const currentItem = (navGroups.flatMap((group) => [
    ...group.items,
  ]) as AdminNavItem[])
    .find(({ href }) => isActive(href));

  return (
    <div className="min-h-screen bg-muted/30">
      <div
        className={cn(
          "mx-auto grid w-full max-w-[1920px] gap-0 transition-[grid-template-columns] duration-200",
          sidebarCollapsed
            ? "lg:grid-cols-[5.5rem_minmax(0,1fr)]"
            : "lg:grid-cols-[18rem_minmax(0,1fr)]",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/70 bg-background px-4 py-3 lg:hidden">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-semibold tracking-tight"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src="/icon.png"
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-lg object-contain"
            />
            <span>
              gearPC <span className="text-muted-foreground">Admin</span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-xl border p-2 hover:bg-muted"
            aria-label={mobileOpen ? t("close") : t("openMenu")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>

        <aside
          className={cn(
            "border-r border-slate-800 bg-slate-950 text-slate-100 lg:block",
            mobileOpen ? "block" : "hidden",
          )}
        >
          <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
            <div
              className={cn(
                "hidden items-center border-b border-white/10 px-4 py-5 lg:flex",
                sidebarCollapsed ? "justify-center" : "gap-2",
              )}
            >
              <Image
                src="/icon.png"
                alt=""
                width={36}
                height={36}
                className="size-9 rounded-xl object-contain"
              />
              {!sidebarCollapsed ? (
                <div className="min-w-0">
                  <p className="font-semibold tracking-tight">gearPC</p>
                  <p className="text-xs text-slate-400">{t("label")}</p>
                </div>
              ) : null}
              <button
                type="button"
                className={cn(
                  "ml-auto rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white",
                  sidebarCollapsed && "ml-0",
                )}
                aria-label={
                  sidebarCollapsed ? t("expandSidebar") : t("collapseSidebar")
                }
                title={
                  sidebarCollapsed ? t("expandSidebar") : t("collapseSidebar")
                }
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="size-4" />
                ) : (
                  <PanelLeftClose className="size-4" />
                )}
              </button>
            </div>

            <div className="border-b border-white/10 px-3 py-4">
              <div
                className={cn(
                  "flex items-center rounded-2xl bg-white/5 p-3",
                  sidebarCollapsed ? "justify-center" : "gap-3",
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400 font-semibold text-slate-950">
                  {initials}
                </span>
                {!sidebarCollapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {displayName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {role.replace("ROLE_", "")}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <nav
              className={cn(
                "min-h-0 flex-1 space-y-5 overflow-y-auto py-5",
                sidebarCollapsed ? "px-2" : "px-3",
              )}
              aria-label={t("label")}
            >
              {navGroups.map((group) => (
                <div key={group.label}>
                  {!sidebarCollapsed ? (
                    <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {t(group.label)}
                    </p>
                  ) : null}
                  <div className="space-y-1">
                    {group.items.map(({ key, href, icon: Icon }) => {
                      const active = isActive(href);
                      return (
                        <Link
                          key={key}
                          href={href}
                          prefetch={false}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "group flex items-center rounded-xl py-2.5 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white",
                            sidebarCollapsed
                              ? "justify-center px-2"
                              : "gap-3 px-3",
                            active &&
                              "bg-blue-500/20 text-white ring-1 ring-blue-300/30 shadow-lg shadow-blue-950/30 hover:bg-blue-500/25 hover:text-white",
                          )}
                          title={sidebarCollapsed ? t("nav." + key) : undefined}
                        >
                          <Icon className="size-4 shrink-0" />
                          {!sidebarCollapsed ? (
                            <>
                              <span className="min-w-0 flex-1 whitespace-nowrap">
                                {t("nav." + key)}
                              </span>
                              <ChevronRight className="size-3.5 shrink-0 opacity-40 transition group-hover:translate-x-0.5" />
                            </>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-white/10 p-3">
              <Link
                href="/"
                prefetch={false}
                className={cn(
                  "flex items-center rounded-xl py-2.5 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white",
                  sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3",
                )}
                onClick={() => setMobileOpen(false)}
                title={sidebarCollapsed ? t("viewStore") : undefined}
              >
                <ExternalLink className="size-4" />
                {!sidebarCollapsed ? t("viewStore") : null}
              </Link>
              <button
                type="button"
                className={cn(
                  "mt-1 flex w-full items-center rounded-xl py-2.5 text-left text-sm text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50",
                  sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3",
                )}
                onClick={() => void signOut()}
                disabled={logout.isPending}
                title={sidebarCollapsed ? t("logout") : undefined}
              >
                <LogOut className="size-4" />
                {!sidebarCollapsed ? t("logout") : null}
              </button>
            </div>
          </div>
        </aside>

        <main className="min-h-screen min-w-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_34rem)]">
          <div className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <Home className="size-4 shrink-0 text-muted-foreground" />
                <span className="hidden text-muted-foreground sm:inline">
                  {t("label")}
                </span>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                <span className="truncate font-medium">
                  {currentItem ? t("nav." + currentItem.key) : t("dashboard")}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden rounded-full border bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
                  {t("workspaceReady")}
                </span>
                <Link
                  href="/"
                  prefetch={false}
                  className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <ExternalLink className="size-3.5" />
                  <span className="hidden sm:inline">{t("viewStore")}</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-[1680px] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
