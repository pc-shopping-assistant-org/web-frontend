import {backendFetch} from "@/lib/api/client";
import type {BackendSchema, ProductDetail, ProductPage} from "@/lib/api/types";

export type ProductFilters = Pick<BackendSchema["ProductFilterRequest"], "cursor" | "limit" | "categoryId" | "brandId" | "minPrice" | "maxPrice" | "keyword" | "status" | "sortBy" | "sortDirection">;

export async function getProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return backendFetch<ProductPage>(`/products${query ? `?${query}` : ""}`);
}

export function getProductBySlug(seoName: string) {
  return backendFetch<ProductDetail>(`/products/slug/${encodeURIComponent(seoName)}`);
}
