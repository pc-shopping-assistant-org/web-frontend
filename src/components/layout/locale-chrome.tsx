"use client";

import type {ReactNode} from "react";
import {usePathname} from "@/i18n/navigation";
import type {Locale} from "@/i18n/routing";

import {SiteFooter} from "./site-footer";
import {SiteHeader} from "./site-header";

export function LocaleChrome({locale, children}: {locale: Locale; children: ReactNode}) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAssistant = pathname === "/assistant";

  return (
    <div className={isAssistant ? "flex h-dvh min-h-0 flex-col overflow-hidden" : "flex min-h-screen flex-col"}>
      {!isAdmin ? <SiteHeader locale={locale} /> : null}
      <main className={isAssistant ? "flex min-h-0 flex-1 overflow-hidden" : "flex-1"}>{children}</main>
      {!isAdmin && !isAssistant ? <SiteFooter /> : null}
    </div>
  );
}
