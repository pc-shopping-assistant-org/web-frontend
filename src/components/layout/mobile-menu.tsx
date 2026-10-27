"use client";

import {
  IconClipboardList,
  IconLayoutDashboard,
  IconLayoutGrid,
  IconLogout,
  IconSearch,
  IconUser,
  IconX,
  type Icon,
} from "@tabler/icons-react";
import {useTranslations} from "next-intl";
import {useEffect, type FormEvent} from "react";
import {createPortal} from "react-dom";

import {PersonAvatar} from "@/components/ui/person-avatar";
import {Link} from "@/i18n/navigation";
import type {Locale} from "@/i18n/routing";
import {cn} from "@/lib/utils";

export type MobileMenuLink = {href: "/" | "/products" | "/build-pc" | "/assistant" | "/cart"; label: string; icon: Icon};

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  links: MobileMenuLink[];
  cartCount: number;
  /** Null when nobody is signed in. */
  account: {name: string; email: string; person: {avatarUrl?: string; firstName: string}} | null;
  isStaff: boolean;
  locale: Locale;
  pathname: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  signingOut: boolean;
  onSignOut: () => void;
};

const ROW = "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition hover:bg-muted";
const LANGUAGES: Locale[] = ["vi", "en"];

/** The navigation below the large breakpoint: a drawer from the right with the account first, then where to go, then language. */
export function MobileMenu({
  open,
  onClose,
  links,
  cartCount,
  account,
  isStaff,
  locale,
  pathname,
  searchTerm,
  onSearchTermChange,
  onSearch,
  signingOut,
  onSignOut,
}: MobileMenuProps) {
  const t = useTranslations("nav");
  const home = useTranslations("home");

  useEffect(() => {
    if (!open) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  // Portaled: the sticky header blurs what is behind it, which would make a fixed child fit the header instead of the screen
  return createPortal(
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button type="button" aria-label={t("closeMenu")} tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-slate-950/45" />
      <nav
        aria-label="Mobile navigation"
        className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col bg-background shadow-2xl shadow-slate-950/20"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <span className="text-sm font-semibold">{t("menu")}</span>
          <button type="button" aria-label={t("closeMenu")} onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
            <IconX className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          <form className="relative" onSubmit={onSearch}>
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
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder={home("searchPlaceholder")}
              className="h-10 w-full rounded-xl border bg-muted/40 pl-9 pr-3 text-sm outline-none transition focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/10"
            />
          </form>

          {account ? (
            <Link href="/account" onClick={onClose} className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-3 transition hover:bg-muted">
              <PersonAvatar person={account.person} className="size-11 text-base" />
              <span className="min-w-0">
                <span title={account.name} className="block truncate text-sm font-semibold">{account.name}</span>
                <span title={account.email} className="block truncate text-xs text-muted-foreground">{account.email}</span>
              </span>
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                {t("login")}
              </Link>
              <Link href="/register" onClick={onClose} className="inline-flex h-10 items-center justify-center rounded-xl border text-sm font-semibold transition hover:bg-muted">
                {t("register")}
              </Link>
            </div>
          )}

          <ul className="space-y-0.5">
            <li>
              <Link href="/products" onClick={onClose} className={cn(ROW, "font-medium text-primary hover:bg-primary/5")}>
                <IconLayoutGrid className="size-4" aria-hidden="true" />
                {t("catalogMenu")}
              </Link>
            </li>
            {links.map(({href, label, icon: LinkIcon}) => (
              <li key={href}>
                <Link href={href} onClick={onClose} className={ROW}>
                  <LinkIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  {label}
                  {href === "/cart" && cartCount > 0 ? (
                    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>

          {account ? (
            <ul className="space-y-0.5 border-t pt-3">
              {isStaff ? (
                <li>
                  <Link href="/admin" onClick={onClose} className={cn(ROW, "font-medium text-primary hover:bg-primary/5")}>
                    <IconLayoutDashboard className="size-4" aria-hidden="true" />
                    {t("admin")}
                  </Link>
                </li>
              ) : null}
              <li>
                <Link href="/account" onClick={onClose} className={ROW}>
                  <IconUser className="size-4 text-muted-foreground" aria-hidden="true" />
                  {t("myAccount")}
                </Link>
              </li>
              {!isStaff ? (
                <li>
                  <Link href="/orders" onClick={onClose} className={ROW}>
                    <IconClipboardList className="size-4 text-muted-foreground" aria-hidden="true" />
                    {t("myOrders")}
                  </Link>
                </li>
              ) : null}
              <li>
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className={cn(ROW, "w-full text-left text-muted-foreground disabled:opacity-60")}
                >
                  <IconLogout className="size-4" aria-hidden="true" />
                  {t("logout")}
                </button>
              </li>
            </ul>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">{t("language")}</span>
          <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label={t("language")}>
            {LANGUAGES.map((language) => (
              <Link
                key={language}
                href={pathname}
                locale={language}
                onClick={onClose}
                aria-current={language === locale ? "true" : undefined}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider transition",
                  language === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {language}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>,
    document.body,
  );
}
