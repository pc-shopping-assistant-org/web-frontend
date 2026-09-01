"use client";

import {IconArrowRight, IconSearch} from "@tabler/icons-react";
import {useTranslations} from "next-intl";
import {useState, type FormEvent} from "react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useRouter} from "@/i18n/navigation";

export function HomeSearch() {
  const t = useTranslations("home");
  const router = useRouter();
  const [term, setTerm] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyword = term.trim();
    router.push(keyword ? `/products?keyword=${encodeURIComponent(keyword)}` : "/products");
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div className="flex flex-col gap-1.5 rounded-2xl border bg-background p-1.5 shadow-lg shadow-primary/5 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <label className="sr-only" htmlFor="home-product-search">{t("searchLabel")}</label>
          <Input
            id="home-product-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
          />
        </div>
        <Button type="submit" size="lg" className="h-11 rounded-xl px-5">
          {t("searchCta")}
          <IconArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <p className="px-1 text-xs text-muted-foreground">{t("searchHint")}</p>
    </form>
  );
}
