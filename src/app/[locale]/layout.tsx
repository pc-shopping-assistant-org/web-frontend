import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {NextIntlClientProvider} from "next-intl";
import {hasLocale} from "next-intl";
import {getMessages} from "next-intl/server";
import type {ReactNode} from "react";

import {SiteFooter} from "@/components/layout/site-footer";
import {SiteHeader} from "@/components/layout/site-header";
import {routing, type Locale} from "@/i18n/routing";
import {QueryProvider} from "@/providers/query-provider";

import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "PC Shopping Assistant",
    template: "%s · PC Shopping Assistant",
  },
  description: "A catalog-grounded PC shopping experience.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader locale={locale as Locale} />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
