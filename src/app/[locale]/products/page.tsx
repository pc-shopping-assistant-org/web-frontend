import type {Metadata} from "next";

import {CatalogRouteClient} from "../catalog-route-client";

export const metadata: Metadata = {title: "Products"};

export default async function ProductsPage({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  const numberValue = (key: string) => {
    const raw = value(key);
    if (!raw || !/^\d+$/.test(raw)) return undefined;
    const parsed = Number(raw);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
  };
  const sortBy = value("sortBy");
  const sortDirection = value("sortDirection");

  return (
    <CatalogRouteClient
      key={[value("keyword"), value("categoryId"), value("brandId"), value("minPrice"), value("maxPrice"), sortBy, sortDirection].join("|")}
      initialKeyword={value("keyword")}
      initialCategoryId={value("categoryId")}
      initialBrandId={value("brandId")}
      initialMinPrice={numberValue("minPrice")}
      initialMaxPrice={numberValue("maxPrice")}
      initialSortBy={sortBy === "createdAt" || sortBy === "price" ? sortBy : undefined}
      initialSortDirection={sortDirection === "ASC" || sortDirection === "DESC" ? sortDirection : undefined}
    />
  );
}
