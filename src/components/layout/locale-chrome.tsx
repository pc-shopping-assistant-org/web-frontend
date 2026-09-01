"use client";

import type {ReactNode} from "react";
import {usePathname} from "@/i18n/navigation";
import type {Locale} from "@/i18n/routing";

import {SiteFooter} from "./site-footer";
import {SiteHeader} from "./site-header";

export function LocaleChrome({locale, children}: {locale: Locale; children: ReactNode}) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdmin ? <SiteHeader locale={locale} /> : null}
      <main className="flex-1">{children}</main>
      {!isAdmin ? <SiteFooter /> : null}
    </div>
  );
}
