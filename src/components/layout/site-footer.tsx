import {useTranslations} from "next-intl";

import {Link} from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("nav");
  const common = useTranslations("common");

  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>{common("appName")} · {new Date().getFullYear()}</p>
        <div className="flex gap-4">
          <Link href="/products" className="hover:text-foreground">{t("products")}</Link>
          <Link href="/cart" className="hover:text-foreground">{t("cart")}</Link>
        </div>
      </div>
    </footer>
  );
}
