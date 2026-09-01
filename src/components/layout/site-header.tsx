"use client";

import {
  IconLayoutGrid,
  IconLayoutDashboard,
  IconClipboardList,
  IconMenu2,
  IconSearch,
  IconShoppingCart,
  IconRobot,
  IconUserCircle,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { isStaffRole } from "@/lib/auth/roles";
import { useLogout, useProfile } from "@/features/auth/queries";
import { useCart } from "@/features/cart/queries";
import { useCategories } from "@/features/catalog/queries";
import { CatalogCategoryIcon } from "@/features/catalog/components/catalog-category-icon";
import type {CategoryTree} from "@/features/catalog/contracts/responses";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

export function SiteHeader({ locale }: { locale: Locale }) {
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
  const [searchTerm, setSearchTerm] = useState("");
  const links = [
    { href: "/" as const, label: t("home") },
    { href: "/products" as const, label: t("products"), icon: IconLayoutGrid },
    { href: "/assistant" as const, label: t("assistant"), icon: IconRobot },
    ...(!isStaff
      ? [{ href: "/cart" as const, label: t("cart"), icon: IconShoppingCart }]
      : []),
  ];
  const primaryLinks = profile.isSuccess
    ? [...links, { href: "/orders" as const, label: t("orders"), icon: IconClipboardList }]
    : links;

  const otherLocale: Locale = locale === "vi" ? "en" : "vi";
  const visibleLinks = isStaff
    ? primaryLinks.filter(({ href }) => href !== "/orders")
    : primaryLinks;
  const profileName = profile.data?.fullName ?? profile.data?.email ?? t("account");
  const profileInitials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";

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
    router.push(
      keyword
        ? `/products?keyword=${encodeURIComponent(keyword)}`
        : "/products",
    );
  }

  function isActive(href: string) {
    return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="storefront-wrap flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/icon.png"
            alt={common("appName")}
            width={36}
            height={36}
            className="size-9 rounded-xl object-contain"
            priority
          />
          <span>{common("appName")}</span>
        </Link>

        <CatalogMenu categories={categories.data ?? []} />

        <form
          className="relative mx-4 hidden min-w-[12rem] basis-[14rem] flex-1 md:block lg:basis-[16rem] xl:basis-[18rem] 2xl:max-w-2xl"
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
          className="rounded-lg p-2 md:hidden"
          aria-label={t("openMenu")}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <IconX className="size-5" />
          ) : (
            <IconMenu2 className="size-5" />
          )}
        </button>

        <nav
          className="hidden items-center gap-0 md:flex"
          aria-label="Primary navigation"
        >
          {visibleLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                isActive(href) && "bg-muted text-foreground",
              )}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {label}
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
                <Link href="/admin" className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2 text-sm font-medium text-primary hover:bg-primary/10">
                  <IconLayoutDashboard className="size-4" />
                  {t("admin")}
                </Link>
              ) : null}
              <Link
                href="/account"
                className="ml-1 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-1.5 text-sm font-medium hover:bg-muted"
                aria-label={profileName}
                title={profileName}
              >
                <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-[0.65rem] font-bold text-primary">
                  {profileInitials}
                </span>
                <span className="hidden xl:inline">{t("account")}</span>
              </Link>
              <button
                type="button"
                className="shrink-0 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => void signOut()}
                disabled={logout.isPending}
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="ml-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <IconUserCircle className="size-4" />
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
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

      {open ? (
        <nav
          className="border-t px-4 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <form className="relative mb-3" onSubmit={(event) => { submitSearch(event); setOpen(false); }}>
            <label className="sr-only" htmlFor="mobile-product-search">
              {home("searchLabel")}
            </label>
            <IconSearch
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="mobile-product-search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={home("searchPlaceholder")}
              className="h-10 w-full rounded-xl border bg-muted/40 pl-9 pr-3 text-sm outline-none transition focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/10"
            />
          </form>
          <div className="flex flex-col gap-1">
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-primary hover:bg-primary/5"
            >
              <span className="flex items-center gap-2">
                <IconLayoutGrid className="size-4" />
                {t("catalogMenu")}
              </span>
            </Link>
            {visibleLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
                  {label}
                  {href === "/cart" && cart.data?.totalItems ? (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                      {cart.data.totalItems > 99 ? "99+" : cart.data.totalItems}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
            {profile.isSuccess ? (
              <>
                {isStaff ? (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-sm font-medium text-primary hover:bg-primary/5"
                  >
                    <span className="flex items-center gap-2"><IconLayoutDashboard className="size-4" />{t("admin")}</span>
                  </Link>
                ) : null}
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm hover:bg-muted"
                >
                  {profile.data.fullName ?? t("account")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                  className="rounded-lg px-3 py-3 text-left text-sm hover:bg-muted"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm hover:bg-muted"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm hover:bg-muted"
                >
                  {t("register")}
                </Link>
              </>
            )}
            <Link
              href={pathname}
              locale={otherLocale}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted"
            >
              {otherLocale}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function CatalogMenu({categories}: {categories: CategoryTree[]}) {
  const t = useTranslations("nav");
  const items = getActiveCategories(categories).slice(0, 18);

  return (
    <details className="group relative hidden shrink-0 md:block">
      <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-border/70 bg-background px-3 text-sm font-semibold transition hover:border-primary/30 hover:bg-primary/5 [&::-webkit-details-marker]:hidden">
        <IconLayoutGrid className="size-4 text-primary" aria-hidden="true" />
        {t("catalogMenu")}
        <span className="text-muted-foreground transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="absolute left-0 top-[calc(100%+0.65rem)] z-50 w-[25rem] rounded-2xl border bg-background p-3 shadow-2xl shadow-slate-950/10">
        <div className="flex items-center justify-between gap-3 border-b px-2 pb-3">
          <div>
            <p className="text-sm font-semibold">{t("catalogMenuTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("catalogMenuDescription")}</p>
          </div>
          <Link href="/products" className="text-xs font-semibold text-primary hover:underline">
            {t("viewAll")}
          </Link>
        </div>
        {items.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-1">
            {items.map((category) => (
              <Link
                key={category.id}
                href={`/products?categoryId=${encodeURIComponent(category.id)}`}
                className="flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2.5 text-sm transition hover:bg-primary/5 hover:text-primary"
                style={{paddingLeft: `${0.625 + Math.min(category.depth, 2) * 0.5}rem`}}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <CatalogCategoryIcon categoryName={category.name} className="size-4" strokeWidth={1.7} />
                </span>
                <span className="truncate">{category.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-2 py-5 text-sm text-muted-foreground">{t("catalogMenuEmpty")}</p>
        )}
        <Link href="/assistant?mode=CONSULT" className="mt-3 flex items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/85">
          <IconRobot className="size-4" aria-hidden="true" />
          {t("catalogMenuAssistant")}
        </Link>
      </div>
    </details>
  );
}

function getActiveCategories(categories: CategoryTree[], depth = 0): {id: string; name: string; depth: number}[] {
  return categories.flatMap((category) => {
    if (category.status === ResourceStatus.Inactive || category.status === ResourceStatus.Deleted) return [];
    const current = category.id && category.name ? [{id: category.id, name: category.name, depth}] : [];
    return [...current, ...getActiveCategories(category.children ?? [], depth + 1)];
  });
}
