"use client";

import {
  IconChevronDown,
  IconChevronRight,
  IconDeviceDesktop,
  IconHome,
  IconLayoutGrid,
  IconLayoutDashboard,
  IconMenu2,
  IconSearch,
  IconShoppingCart,
  IconRobot,
  IconUserCircle,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import {useTranslations} from "next-intl";
import {useCallback, useState, type FormEvent} from "react";

import {AccountMenu} from "@/components/layout/account-menu";
import {MobileMenu} from "@/components/layout/mobile-menu";
import {Link, usePathname, useRouter} from "@/i18n/navigation";
import type {Locale} from "@/i18n/routing";
import {cn} from "@/lib/utils";
import {isStaffRole} from "@/lib/auth/roles";
import {useLogout, useProfile} from "@/features/auth/queries";
import {useCart} from "@/features/cart/queries";
import {useCategories} from "@/features/catalog/queries";
import type {CategoryTree} from "@/features/catalog/contracts/responses";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

export function SiteHeader({locale}: {locale: Locale}) {
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const home = useTranslations("home");
  const pathname = usePathname();
  const router = useRouter();
  const profile = useProfile();
  const role = profile.data?.role?.toUpperCase();
  const isStaff = isStaffRole(role);
  const cart = useCart(!isStaff);
  const categories = useCategories();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const closeMenu = useCallback(() => setOpen(false), []);
  const [searchTerm, setSearchTerm] = useState("");
  const links = [
    {href: "/" as const, label: t("home"), icon: IconHome},
    {href: "/products" as const, label: t("products"), icon: IconLayoutGrid},
    {href: "/build-pc" as const, label: "Build PC", icon: IconDeviceDesktop},
    {href: "/assistant" as const, label: t("assistant"), icon: IconRobot},
    ...(!isStaff ? [{href: "/cart" as const, label: t("cart"), icon: IconShoppingCart}] : []),
  ];

  const otherLocale: Locale = locale === "vi" ? "en" : "vi";
  const profileName = profile.data?.fullName ?? profile.data?.email ?? t("account");

  async function signOut() {
    try {
      await logout.mutateAsync();
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyword = searchTerm.trim();
    router.push(keyword ? `/products?keyword=${encodeURIComponent(keyword)}` : "/products");
  }

  function isActive(href: string) {
    return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="storefront-wrap flex h-16 items-center justify-between">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight" onClick={() => setOpen(false)}>
          <Image src="/icon.png" alt={common("appName")} width={36} height={36} className="size-9 rounded-xl object-contain" priority />
          <span>{common("appName")}</span>
        </Link>

        <CatalogMenu categories={categories.data ?? []} />

        <form
          className="relative mx-4 hidden min-w-[12rem] basis-[14rem] flex-1 lg:block lg:basis-[16rem] xl:basis-[18rem] 2xl:max-w-2xl"
          onSubmit={submitSearch}
        >
          <label className="sr-only" htmlFor="site-product-search">
            {home("searchLabel")}
          </label>
          <IconSearch
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="site-product-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={home("searchPlaceholder")}
            className="h-10 w-full rounded-xl border bg-muted/40 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/10"
          />
        </form>

        <button
          type="button"
          className="rounded-lg p-2 lg:hidden"
          aria-label={t("openMenu")}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <IconX className="size-5" /> : <IconMenu2 className="size-5" />}
        </button>

        <nav className="hidden items-center gap-0 lg:flex" aria-label="Primary navigation">
          {links.map(({href, label, icon: Icon}) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                isActive(href) && "bg-muted text-foreground",
              )}
            >
              {Icon ? <Icon className="size-4" /> : null}
              <span className="hidden xl:inline">{label}</span>
              {href === "/cart" && cart.data?.totalItems ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                  {cart.data.totalItems > 99 ? "99+" : cart.data.totalItems}
                </span>
              ) : null}
            </Link>
          ))}
          {profile.isSuccess ? (
            <>
              {isStaff ? (
                <Link
                  href="/admin"
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                >
                  <IconLayoutDashboard className="size-4" />
                  {t("admin")}
                </Link>
              ) : null}
              <AccountMenu
                name={profileName}
                person={{avatarUrl: profile.data.avatarUrl, firstName: profile.data.firstName}}
                showOrders={!isStaff}
                signingOut={logout.isPending}
                onSignOut={() => void signOut()}
              />
            </>
          ) : (
            <>
              <Link href="/login" className="ml-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
                <IconUserCircle className="size-4" />
                {t("login")}
              </Link>
              <Link href="/register" className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted">
                {t("register")}
              </Link>
            </>
          )}
          <Link
            href={pathname}
            locale={otherLocale}
            className="ml-1 shrink-0 rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {otherLocale}
          </Link>
        </nav>
      </div>

      <MobileMenu
        open={open}
        onClose={closeMenu}
        links={links}
        cartCount={cart.data?.totalItems ?? 0}
        account={
          profile.isSuccess
            ? {name: profileName, email: profile.data.email, person: {avatarUrl: profile.data.avatarUrl, firstName: profile.data.firstName}}
            : null
        }
        isStaff={isStaff}
        locale={locale}
        pathname={pathname}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSearch={(event) => {
          submitSearch(event);
          closeMenu();
        }}
        signingOut={logout.isPending}
        onSignOut={() => void signOut()}
      />
    </header>
  );
}

/** Most top-level categories the menu lists; the rest are one tap away on the products page. */
const MENU_CATEGORY_LIMIT = 24;

type MenuCategory = {id: string; name: string; children: MenuCategory[]};

function CatalogMenu({categories}: {categories: CategoryTree[]}) {
  const t = useTranslations("nav");
  const items = getActiveCategories(categories).slice(0, MENU_CATEGORY_LIMIT);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <details className="group relative hidden shrink-0 lg:block">
      <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-border/70 bg-background px-3 text-sm font-semibold transition hover:border-primary/30 hover:bg-primary/5 [&::-webkit-details-marker]:hidden">
        <IconLayoutGrid className="size-4 text-primary" aria-hidden="true" />
        {t("catalogMenu")}
        <IconChevronDown className="size-4 text-muted-foreground transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="absolute left-0 top-[calc(100%+0.65rem)] z-50 w-[22rem] rounded-2xl border bg-background p-3 shadow-2xl shadow-slate-950/10">
        <div className="flex items-center justify-between gap-3 border-b px-2 pb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t("catalogMenuTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("catalogMenuDescription")}</p>
          </div>
          <Link href="/products" className="shrink-0 whitespace-nowrap text-xs font-semibold text-primary hover:underline">
            {t("viewAll")}
          </Link>
        </div>
        {items.length > 0 ? (
          <ul className="mt-2 max-h-80 space-y-0.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {items.map((category) => {
              const open = expanded.has(category.id);
              return (
                <li key={category.id}>
                  <div className="flex items-center rounded-xl transition hover:bg-primary/5">
                    <Link
                      href={`/products?categoryId=${encodeURIComponent(category.id)}`}
                      className="min-w-0 flex-1 truncate rounded-xl px-3 py-2.5 text-sm font-medium transition hover:text-primary"
                      title={category.name}
                    >
                      {category.name}
                    </Link>
                    {category.children.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggle(category.id)}
                        aria-expanded={open}
                        aria-label={t(open ? "collapseCategory" : "expandCategory", {name: category.name})}
                        className="mr-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                      >
                        <IconChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                  {open ? <MenuBranch nodes={category.children} /> : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-2 py-5 text-sm text-muted-foreground">{t("catalogMenuEmpty")}</p>
        )}
        <Link
          href="/assistant"
          className="mt-3 flex items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/85"
        >
          <IconRobot className="size-4" aria-hidden="true" />
          {t("catalogMenuAssistant")}
        </Link>
      </div>
    </details>
  );
}

/** Sub-categories sit under their parent behind a guide line, so they read as its children and not as more top-level entries. */
function MenuBranch({nodes}: {nodes: MenuCategory[]}) {
  return (
    <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-border/80 pl-2">
      {nodes.map((node) => (
        <li key={node.id}>
          <Link
            href={`/products?categoryId=${encodeURIComponent(node.id)}`}
            className="block truncate rounded-lg px-2 py-1.5 text-[0.82rem] text-muted-foreground transition hover:bg-primary/5 hover:text-primary"
            title={node.name}
          >
            {node.name}
          </Link>
          {node.children.length > 0 ? <MenuBranch nodes={node.children} /> : null}
        </li>
      ))}
    </ul>
  );
}

function getActiveCategories(categories: CategoryTree[]): MenuCategory[] {
  return categories.flatMap((category) => {
    if (category.status === ResourceStatus.Inactive || category.status === ResourceStatus.Deleted) return [];
    const children = getActiveCategories(category.children ?? []);
    return category.id && category.name ? [{id: category.id, name: category.name, children}] : children;
  });
}
