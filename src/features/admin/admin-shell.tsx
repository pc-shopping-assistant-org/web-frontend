"use client";

import {
  Bot,
  BadgePercent,
  Boxes,
  Building2,
  ChartColumnBig,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileText,
  FolderTree,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  UserCog,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";

import { ErrorMessage } from "@/components/ui/error-message";
import { AdminPageSkeleton } from "@/components/ui/loading-skeletons";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useLogout, useProfile } from "@/features/auth/queries";
import { isAdminRole, isEmployeeRole, isStaffRole } from "@/lib/auth/roles";
import { ApiClientError } from "@/lib/api/envelope";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "navGroups.overview",
    items: [
      { key: "dashboard", href: "/admin", icon: LayoutDashboard },
      { key: "statistics", href: "/admin/statistics", icon: ChartColumnBig, adminOnly: true },
    ],
  },
  {
    label: "navGroups.tools",
    items: [{ key: "aiAssistant", href: "/assistant", icon: Bot }],
  },
  {
    label: "navGroups.orders",
    items: [
      { key: "orders", href: "/admin/orders", icon: Boxes, employeeOnly: true },
      { key: "invoices", href: "/admin/invoices", icon: FileText, employeeOnly: true },
    ],
  },
  {
    label: "navGroups.catalog",
    items: [
      {
        key: "products",
        href: "/admin/products",
        icon: Package,
        employeeOnly: true,
        children: [
          { key: "productList", href: "/admin/products" },
          { key: "productCreate", href: "/admin/products/new" },
        ],
      },
      { key: "categories", href: "/admin/categories", icon: FolderTree, employeeOnly: true },
      { key: "catalogSettings", href: "/admin/options", icon: SlidersHorizontal, employeeOnly: true },
      { key: "brands", href: "/admin/brands", icon: Building2, employeeOnly: true },
      {
        key: "discounts",
        href: "/admin/discounts",
        icon: BadgePercent,
        employeeOnly: true,
        children: [
          { key: "discountList", href: "/admin/discounts" },
          { key: "discountCreate", href: "/admin/discounts/new" },
        ],
      },
    ],
  },
  {
    label: "navGroups.payments",
    items: [
      { key: "payments", href: "/admin/payments", icon: CreditCard, employeeOnly: true },
      {
        key: "paymentMethods",
        href: "/admin/payment-methods",
        icon: CircleDollarSign, employeeOnly: true,
      },
    ],
  },
  {
    label: "navGroups.management",
    items: [
      { key: "customers", href: "/admin/customers", icon: Users, employeeOnly: true },
      { key: "employees", href: "/admin/employees", icon: UserCog, adminOnly: true },
    ],
  },
] as const;

type AdminNavChild = { key: string; href: string };
type AdminNavItem = { key: string; href: string; icon: LucideIcon; children?: readonly AdminNavChild[] };

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("admin");
  const profile = useProfile();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  const signedOut = profile.error instanceof ApiClientError && profile.error.status === 401;
  const {mutate: endSession} = logout;
  useEffect(() => {
    // The token cookie is still there but no longer works; drop it, or the proxy sends /login straight back here.
    if (signedOut) endSession(undefined, {onSettled: () => router.replace("/login")});
  }, [signedOut, endSession, router]);

  if (profile.isPending || signedOut) return <AdminPageSkeleton />;
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

  const isVisible = (item: object) =>
    (!("adminOnly" in item) || isAdminRole(role)) &&
    (!("employeeOnly" in item) || isEmployeeRole(role));

  function isActive(href: string) {
    return href === "/admin" ? pathname === href : pathname.startsWith(href);
  }

  /** The child whose address matches the longest, so "/admin/products/new" is not also the list. */
  function activeChild(children: readonly AdminNavChild[]) {
    return children
      .filter(({ href }) => isActive(href))
      .sort((left, right) => right.href.length - left.href.length)[0];
  }

  const currentItem = (navGroups.flatMap((group) => [
    ...group.items,
  ]) as AdminNavItem[])
    .find(({ href }) => isActive(href));
  const currentKey = currentItem?.children
    ? (activeChild(currentItem.children)?.key ?? currentItem.key)
    : currentItem?.key;

  return (
    <div className="min-h-screen bg-muted/30">
      <div
        className={cn(
          "grid w-full gap-0 transition-[grid-template-columns] duration-200",
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
              {navGroups.map((group) => ({ group, items: group.items.filter(isVisible) })).filter(({ items }) => items.length > 0).map(({ group, items }) => (
                <div key={group.label}>
                  {!sidebarCollapsed ? (
                    <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {t(group.label)}
                    </p>
                  ) : null}
                  <div className="space-y-1">
                    {(items as readonly AdminNavItem[]).map(({ key, href, icon: Icon, children: subItems }) => {
                      const active = isActive(href);
                      const itemClass = cn(
                        "group flex w-full items-center rounded-xl py-2.5 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white",
                        sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3",
                      );
                      const activeClass =
                        "bg-blue-500/20 text-white ring-1 ring-blue-300/30 shadow-lg shadow-blue-950/30 hover:bg-blue-500/25 hover:text-white";
                      if (subItems && !sidebarCollapsed) {
                        const open = toggled[key] ?? active;
                        const current = activeChild(subItems);
                        return (
                          <div key={key}>
                            <button
                              type="button"
                              aria-expanded={open}
                              onClick={() => setToggled((value) => ({ ...value, [key]: !open }))}
                              className={cn(itemClass, "text-left", active && !open && activeClass)}
                            >
                              <Icon className="size-4 shrink-0" />
                              <span className="min-w-0 flex-1 whitespace-nowrap">{t("nav." + key)}</span>
                              <ChevronDown className={cn("size-3.5 shrink-0 opacity-60 transition", open && "rotate-180")} />
                            </button>
                            {open ? (
                              <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-3">
                                {subItems.map((child) => (
                                  <Link
                                    key={child.key}
                                    href={child.href}
                                    prefetch={false}
                                    aria-current={current?.key === child.key ? "page" : undefined}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                      "block rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white",
                                      current?.key === child.key && "bg-blue-500/20 text-white hover:bg-blue-500/25",
                                    )}
                                  >
                                    {t("nav." + child.key)}
                                  </Link>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      }
                      return (
                        <Link
                          key={key}
                          href={href}
                          prefetch={false}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setMobileOpen(false)}
                          className={cn(itemClass, active && activeClass)}
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
                  {currentKey ? t("nav." + currentKey) : t("dashboard")}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden rounded-full border bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
                  {t("workspaceReady")}
                </span>
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
