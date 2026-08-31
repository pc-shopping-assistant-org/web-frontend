import * as rootParams from "next/root-params";
import {notFound} from "next/navigation";
import {getRequestConfig} from "next-intl/server";
import {hasLocale} from "next-intl";

import {routing} from "./routing";

export default getRequestConfig(async ({locale}) => {
  let resolvedLocale = locale;

  if (!resolvedLocale) {
    const parameterLocale = await rootParams.locale();
    if (hasLocale(routing.locales, parameterLocale)) {
      resolvedLocale = parameterLocale;
    }
  }

  if (!resolvedLocale || !hasLocale(routing.locales, resolvedLocale)) {
    notFound();
  }

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  };
});
