import {backendFetch} from "@/lib/api/client";
import type {
  BrandDto,
  CategoryTreeDto,
  ProductDetailDto,
  ProductPageDto,
  ProductRatingSummaryDto,
  ReviewDto,
  ReviewsPageDto,
} from "@/features/catalog/contracts/dto";
import {
  mapBrand,
  mapCategoryTree,
  mapProductDetail,
  mapProductPage,
  mapProductRatingSummary,
  mapReview,
  mapReviewsPage,
} from "@/features/catalog/mappers";
import {
  createReviewRequestSchema,
  type CreateReviewRequest,
} from "@/features/catalog/contracts/requests";
import {parseRequest} from "@/lib/api/parse-request";
import {ReviewStatus} from "@/lib/domain/catalog-enums";

export type ProductFilters = {
  cursor?: string;
  limit?: number;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: string;
};

export async function getProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  const response = await backendFetch<ProductPageDto>(
    `/products${query ? `?${query}` : ""}`,
  );
  return mapProductPage(response);
}

export async function getProductBySlug(seoName: string) {
  const response = await backendFetch<ProductDetailDto>(
    `/products/slug/${encodeURIComponent(seoName)}`,
  );
  return mapProductDetail(response);
}

export async function getCategories() {
  const response = await backendFetch<CategoryTreeDto[]>("/categories");
  return response.map(mapCategoryTree);
}

export async function getBrands() {
  const response = await backendFetch<BrandDto[]>("/brands");
  return response.map(mapBrand);
}

export async function getProductReviews(productId: string, cursor?: string) {
  const params = new URLSearchParams({status: ReviewStatus.Active, limit: "10"});
  if (cursor) params.set("cursor", cursor);
  const response = await backendFetch<ReviewsPageDto>(
    `/products/${encodeURIComponent(productId)}/reviews?${params.toString()}`,
  );
  return mapReviewsPage(response);
}

export async function getProductRatingSummary(productId: string) {
  const response = await backendFetch<ProductRatingSummaryDto>(
    `/products/${encodeURIComponent(productId)}/reviews/summary`,
  );
  return mapProductRatingSummary(response);
}

export async function createProductReview(productId: string, request: CreateReviewRequest) {
  const payload = parseRequest(createReviewRequestSchema, request);
  const response = await backendFetch<ReviewDto>(`/products/${encodeURIComponent(productId)}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapReview(response);
}
