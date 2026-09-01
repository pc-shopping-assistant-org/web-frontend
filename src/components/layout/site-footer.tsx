"use client";

import {useTranslations} from "next-intl";

import {Link} from "@/i18n/navigation";
import {useProfile} from "@/features/auth/queries";
import {isStaffRole} from "@/lib/auth/roles";

export function SiteFooter() {
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const profile = useProfile();
  const isStaff = isStaffRole(profile.data?.role);
  const shopLinks = [
    {href: "/products" as const, label: t("products")},
    ...(isStaff ? [] : [{href: "/cart" as const, label: t("cart")}]),
    {href: "/assistant" as const, label: t("assistant")},
  ];
  const accountLinks = isStaff
    ? [
        {href: "/account" as const, label: t("account")},
        {href: "/admin/orders" as const, label: t("adminOrders")},
      ]
    : [
        {href: "/account" as const, label: t("account")},
        {href: "/orders" as const, label: t("orders")},
        {href: "/login" as const, label: t("login")},
        {href: "/register" as const, label: t("register")},
      ];

  return (
    <footer className="mt-auto border-t bg-slate-950 text-slate-300">
      <div className="storefront-wrap py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <p className="text-lg font-semibold tracking-tight text-white">{common("appName")}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{common("footerDescription")}</p>
            <Link href="/assistant" className="mt-5 inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10">{t("assistant")}</Link>
          </div>
          <FooterColumn title={common("footerShop")} links={shopLinks} />
          <FooterColumn title={common("footerAccount")} links={accountLinks} />
          <div>
            <p className="text-sm font-semibold text-white">{common("footerTrust")}</p>
            <div className="mt-3 space-y-2 text-sm text-slate-400">
              <p>{common("footerCatalog")}</p>
              <p>{common("footerPricing")}</p>
              <p>{common("footerSupport")}</p>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-4 text-xs text-slate-500">
          © {new Date().getFullYear()} {common("appName")}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({title, links}: {title: string; links: {href: "/products" | "/cart" | "/assistant" | "/account" | "/orders" | "/login" | "/register" | "/admin/orders"; label: string}[]}) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 flex flex-col items-start gap-2 text-sm text-slate-400">
        {links.map((link) => <Link key={link.href} href={link.href} className="transition hover:text-white">{link.label}</Link>)}
      </div>
    </div>
  );
}
