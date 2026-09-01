import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {NextIntlClientProvider} from "next-intl";
import {hasLocale} from "next-intl";
import {getMessages} from "next-intl/server";
import type {ReactNode} from "react";

import {LocaleChrome} from "@/components/layout/locale-chrome";
import {routing, type Locale} from "@/i18n/routing";
import {QueryProvider} from "@/providers/query-provider";

import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "gearPC",
    template: "%s · gearPC",
  },
  description: "gearPC — khám phá và chọn thiết bị PC phù hợp.",
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
            <LocaleChrome locale={locale as Locale}>{children}</LocaleChrome>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
