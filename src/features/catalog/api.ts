import {backendFetch} from "@/lib/api/client";
import type {BackendSchema, Brand, CategoryTree, ProductDetail, ProductPage, Review, ReviewsPage} from "@/lib/api/types";

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

export function getCategories() {
  return backendFetch<CategoryTree[]>("/categories");
}

export function getBrands() {
  return backendFetch<Brand[]>("/brands");
}

export function getProductReviews(productId: string, cursor?: string) {
  const params = new URLSearchParams({status: "ACTIVE", limit: "10"});
  if (cursor) params.set("cursor", cursor);
  return backendFetch<ReviewsPage>(`/products/${encodeURIComponent(productId)}/reviews?${params.toString()}`);
}

export function createProductReview(productId: string, request: BackendSchema["CreateReviewRequest"]) {
  return backendFetch<Review>(`/products/${encodeURIComponent(productId)}/reviews`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}
