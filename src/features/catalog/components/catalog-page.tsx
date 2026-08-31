"use client";

import {Search} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {ApiClientError} from "@/lib/api/envelope";

import {useProducts} from "../queries";
import {ProductGrid} from "./product-grid";

export function CatalogPage() {
  const t = useTranslations("catalog");
  const common = useTranslations("common");
  const [term, setTerm] = useState("");
  const [keyword, setKeyword] = useState<string | undefined>();
  const query = useProducts({limit: 12, keyword});
  const products = query.data?.items ?? [];

  return (
    <section className="page-wrap py-12 sm:py-16">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="eyebrow">{t("allProducts")}</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <form
          className="flex w-full max-w-lg gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setKeyword(term.trim() || undefined);
          }}
        >
          <Input value={term} onChange={(event) => setTerm(event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} />
          <Button type="submit"><Search className="size-4" />{t("search")}</Button>
        </form>
      </div>

      {query.isPending ? <CatalogLoading /> : null}
      {query.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium">{t("loadError")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{query.error instanceof ApiClientError && query.error.messageKey === "SERVICE_UNAVAILABLE" ? common("backendUnavailable") : common("unknownError")}</p>
          <Button className="mt-5" variant="outline" onClick={() => void query.refetch()}>{common("retry")}</Button>
        </div>
      ) : null}
      {!query.isPending && !query.isError ? <ProductGrid products={products} /> : null}
    </section>
  );
}

function CatalogLoading() {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length: 6}, (_, index) => <div key={index} className="h-96 animate-pulse rounded-2xl bg-muted" />)}</div>;
}
