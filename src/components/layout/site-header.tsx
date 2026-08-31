"use client";

import {Menu, ShoppingCart, Sparkles, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";

import {Link, usePathname, useRouter} from "@/i18n/navigation";
import type {Locale} from "@/i18n/routing";
import {cn} from "@/lib/utils";
import {useLogout, useProfile} from "@/features/auth/queries";

export function SiteHeader({locale}: {locale: Locale}) {
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const profile = useProfile();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const links = [
    {href: "/" as const, label: t("home")},
    {href: "/products" as const, label: t("products")},
    {href: "/cart" as const, label: t("cart"), icon: ShoppingCart},
  ];

  const otherLocale: Locale = locale === "vi" ? "en" : "vi";

  async function signOut() {
    try { await logout.mutateAsync(); } finally { router.push("/"); router.refresh(); }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight" onClick={() => setOpen(false)}>
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <span>{common("appName")}</span>
        </Link>

        <button
          type="button"
          className="rounded-lg p-2 md:hidden"
          aria-label={t("openMenu")}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {links.map(({href, label, icon: Icon}) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                pathname === href && "bg-muted text-foreground",
              )}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {label}
            </Link>
          ))}
          {profile.isSuccess ? <><Link href="/account" className="ml-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted">{profile.data.fullName ?? t("account")}</Link><button type="button" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => void signOut()} disabled={logout.isPending}>{t("logout")}</button></> : <><Link href="/login" className="ml-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">{t("login")}</Link><Link href="/register" className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted">{t("register")}</Link></>}
          <Link href={pathname} locale={otherLocale} className="ml-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground">
            {otherLocale}
          </Link>
        </nav>
      </div>

      {open ? (
        <nav className="border-t px-4 py-3 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-1">
            {links.map(({href, label}) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm hover:bg-muted">
                {label}
              </Link>
            ))}
            {profile.isSuccess ? <><Link href="/account" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm hover:bg-muted">{profile.data.fullName ?? t("account")}</Link><button type="button" onClick={() => {setOpen(false); void signOut();}} className="rounded-lg px-3 py-3 text-left text-sm hover:bg-muted">{t("logout")}</button></> : <><Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm hover:bg-muted">{t("login")}</Link><Link href="/register" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm hover:bg-muted">{t("register")}</Link></>}
            <Link href={pathname} locale={otherLocale} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted">
              {otherLocale}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
