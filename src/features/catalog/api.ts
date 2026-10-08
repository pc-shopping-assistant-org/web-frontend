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
  mapBrandResponse,
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
};

export async function getProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  const response = await backendFetch<ProductPageDto>(
    `/catalog-service/products${query ? `?${query}` : ""}`,
  );
  return mapProductPage(response);
}

export async function getProductBySlug(seoName: string) {
  const response = await backendFetch<ProductDetailDto>(
    `/catalog-service/products/slug/${encodeURIComponent(seoName)}`,
  );
  return mapProductDetail(response);
}

/** How a category names and orders its specification attributes (public read of the attribute template). */
export type SpecLabels = Record<string, {label: string; unit?: string; order: number}>;

export async function getCategorySpecLabels(categoryId: string): Promise<SpecLabels> {
  const template = await backendFetch<{
    groups: {displayOrder: number; attributes: {key: string; displayName: string; unit?: string | null; displayOrder: number}[]}[];
  }>(`/catalog-service/categories/${encodeURIComponent(categoryId)}/attributes`);
  const labels: SpecLabels = {};
  for (const group of [...template.groups].sort((a, b) => a.displayOrder - b.displayOrder)) {
    for (const attribute of [...group.attributes].sort((a, b) => a.displayOrder - b.displayOrder)) {
      labels[attribute.key] = {label: attribute.displayName, unit: attribute.unit ?? undefined, order: Object.keys(labels).length};
    }
  }
  return labels;
}

export async function getCategories() {
  const response = await backendFetch<CategoryTreeDto[]>("/catalog-service/categories/tree");
  return response.map(mapCategoryTree);
}

export async function getBrands() {
  const response = await backendFetch<BrandDto[]>("/catalog-service/brands");
  return response.map(mapBrandResponse);
}

export async function getProductReviews(productId: string, cursor?: string) {
  const params = new URLSearchParams({status: ReviewStatus.Active, limit: "10"});
  if (cursor) params.set("cursor", cursor);
  const response = await backendFetch<ReviewsPageDto>(
    `/catalog-service/products/${encodeURIComponent(productId)}/reviews?${params.toString()}`,
  );
  return mapReviewsPage(response);
}

export async function getProductRatingSummary(productId: string) {
  const response = await backendFetch<ProductRatingSummaryDto>(
    `/catalog-service/products/${encodeURIComponent(productId)}/reviews/summary`,
  );
  return mapProductRatingSummary(response);
}

export async function createProductReview(productId: string, request: CreateReviewRequest) {
  const payload = parseRequest(createReviewRequestSchema, request);
  const response = await backendFetch<ReviewDto>(`/catalog-service/products/${encodeURIComponent(productId)}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapReview(response);
}
