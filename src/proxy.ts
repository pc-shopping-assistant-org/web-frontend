import createMiddleware from "next-intl/middleware";
import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

import {routing} from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // BFF routes own their path space and must not be rewritten by next-intl.
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  const localeMatch = pathname.match(/^\/(vi|en)(?:\/|$)/);
  const locale = localeMatch?.[1];
  const isProtectedAccountRoute = /^\/(?:vi|en)\/account(?:\/|$)/.test(pathname);

  if (isProtectedAccountRoute && !request.cookies.get("ecm_access_token")?.value) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale ?? routing.defaultLocale}/login`;
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
