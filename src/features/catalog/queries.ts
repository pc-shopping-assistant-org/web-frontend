"use client";

import {useQuery} from "@tanstack/react-query";

import {getProductBySlug, getProducts, type ProductFilters} from "./api";

export const catalogKeys = {
  all: ["catalog"] as const,
  products: (filters: ProductFilters) => ["catalog", "products", filters] as const,
  product: (slug: string) => ["catalog", "product", slug] as const,
};

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: catalogKeys.products(filters),
    queryFn: () => getProducts(filters),
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: catalogKeys.product(slug),
    queryFn: () => getProductBySlug(slug),
    enabled: Boolean(slug),
  });
}
