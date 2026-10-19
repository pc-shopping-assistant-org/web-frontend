import createMiddleware from "next-intl/middleware";
import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

import {ACCESS_TOKEN_COOKIE} from "@/lib/auth/cookies";
import {isStaffRole} from "@/lib/auth/roles";
import {routing} from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

type TokenClaims = {role?: unknown; exp?: unknown};

function claimsOf(token: string | undefined): TokenClaims {
  try {
    const payload = token?.split(".")[1];
    if (!payload) return {};
    const binary = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))) as TokenClaims;
  } catch {
    return {};
  }
}

/**
 * The role claim of the access token. It only decides where the page goes: the backend checks the signature on every
 * call, so a forged cookie opens nothing but the admin shell, which then gets 401s.
 */
function roleOf(token: string | undefined) {
  const {role} = claimsOf(token);
  return typeof role === "string" ? role : undefined;
}

/** Signed in as far as the cookie can tell. An expired token does not count, or "sign in again" would bounce back. */
function hasLiveSession(token: string | undefined) {
  const {exp} = claimsOf(token);
  return typeof exp === "number" && exp * 1000 > Date.now();
}

export function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // BFF routes own their path space and must not be rewritten by next-intl.
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  const localeMatch = pathname.match(/^\/(vi|en)(?:\/|$)/);
  const locale = localeMatch?.[1];
  const isProtectedAccountRoute = /^\/(?:vi|en)\/(?:account|checkout|orders|admin)(?:\/|$)/.test(pathname);

  if (isProtectedAccountRoute && !request.cookies.get("ecm_access_token")?.value) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale ?? routing.defaultLocale}/login`;
    // The next-intl router accepts an internal pathname (without the locale).
    // Keeping the locale in this value makes a successful login attempt to
    // navigate to `/vi/vi/admin` when the protected route was opened directly.
    const internalPath = pathname.replace(/^\/(?:vi|en)(?=\/|$)/, "") || "/";
    redirectUrl.searchParams.set("redirect", internalPath);
    return NextResponse.redirect(redirectUrl);
  }

  // Someone already signed in has no use for the sign-in pages: send them where they were headed, or home.
  const isGuestOnlyPage = /^\/(?:vi|en)\/(?:login|register|forgot-password)\/?$/.test(pathname);
  if (isGuestOnlyPage && hasLiveSession(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value)) {
    const requested = request.nextUrl.searchParams.get("redirect");
    const target = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/";
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = `/${locale}${target === "/" ? "" : target}`;
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  // Employees and admins work in the admin area only; the storefront is for customers.
  const isAdminRoute = /^\/(?:vi|en)\/admin(?:\/|$)/.test(pathname);
  const isStorefrontPage = locale !== undefined && !isAdminRoute;
  if (isStorefrontPage && isStaffRole(roleOf(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value))) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = `/${locale}/admin`;
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
