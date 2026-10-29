import {backendFetch} from "@/lib/api/client";
import type {
  BrandDto,
  CategoryTreeDto,
  ProductDetailDto,
  ProductPageDto,
  OrderLineProductDto,
  ProductReviewDto,
  ReviewedOrderItemDto,
  ProductReviewPageDto,
  ProductVariantLookupDto,
} from "@/features/catalog/contracts/dto";
import {
  mapBrandResponse,
  mapCategoryTree,
  mapProductDetail,
  mapProductDetailToSummary,
  mapProductPage,
  mapProductReview,
  mapProductReviewPage,
} from "@/features/catalog/mappers";
import {
  createReviewRequestSchema,
  editReviewRequestSchema,
  type CreateReviewRequest,
  type EditReviewRequest,
} from "@/features/catalog/contracts/requests";
import {parseRequest} from "@/lib/api/parse-request";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

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
  const response = await backendFetch<ProductPageDto>(`/catalog-service/products${query ? `?${query}` : ""}`);
  return mapProductPage(response);
}

/** search-service row; it only indexes what the storefront shows, so every hit is on sale. */
type ProductSearchHitDto = {
  id: string;
  name: string;
  seoName: string;
  brandName?: string | null;
  categoryName?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  inStock?: boolean;
  mainImageUrl?: string | null;
};
type ProductSearchPageDto = {content: ProductSearchHitDto[]; page: number; size: number; last: boolean};

const DEFAULT_SEARCH_SIZE = 12;

/**
 * Text search through search-service (Elasticsearch): by name, brand, category and description, tolerant of accents and typos,
 * and narrowed by the same category, brand and price filters as the catalog list.
 * It pages by number, so the next page number travels as the cursor the catalog list also uses.
 */
export async function searchProducts(keyword: string, filters: Omit<ProductFilters, "keyword"> = {}) {
  const page = Number.parseInt(filters.cursor ?? "0", 10);
  const params = new URLSearchParams({
    q: keyword,
    page: String(Number.isNaN(page) ? 0 : page),
    size: String(filters.limit ?? DEFAULT_SEARCH_SIZE),
  });
  for (const key of ["categoryId", "brandId", "minPrice", "maxPrice"] as const) {
    const value = filters[key];
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const response = await backendFetch<ProductSearchPageDto>(`/search-service/products/search?${params.toString()}`);
  return mapProductPage({
    items: (response.content ?? []).map((hit) => ({
      ...hit,
      status: ResourceStatus.Active,
      totalQuantity: hit.inStock === false ? 0 : undefined,
    })),
    nextCursor: response.last ? null : String(response.page + 1),
    hasNext: !response.last,
    size: response.content?.length ?? 0,
  });
}

/** A keyword goes to the search, without one the catalog lists; both narrow by category, brand and price. */
export function listProducts(filters: ProductFilters = {}) {
  const keyword = filters.keyword?.trim();
  return keyword ? searchProducts(keyword, filters) : getProducts({...filters, keyword: undefined});
}

export async function getProductBySlug(seoName: string) {
  const response = await backendFetch<ProductDetailDto>(`/catalog-service/products/slug/${encodeURIComponent(seoName)}`);
  return mapProductDetail(response);
}

export async function getProductById(productId: string) {
  const response = await backendFetch<ProductDetailDto>(`/catalog-service/products/${encodeURIComponent(productId)}`);
  return mapProductDetail(response);
}

export async function getProductSummariesByIds(productIds: string[]) {
  const products = await Promise.all(productIds.map((productId) => getProductById(productId)));
  return products.map(mapProductDetailToSummary);
}

/** How a category names and orders its specification attributes (public read of the attribute template). */
export type SpecLabels = Record<string, {label: string; unit?: string; order: number}>;

export async function getCategorySpecLabels(categoryId: string): Promise<SpecLabels> {
  const template = await backendFetch<{
    attributes: {key: string; displayName: string; unit?: string | null; displayOrder: number}[];
  }>(`/catalog-service/categories/${encodeURIComponent(categoryId)}/attributes`);
  const labels: SpecLabels = {};
  for (const attribute of [...template.attributes].sort((a, b) => a.displayOrder - b.displayOrder)) {
    labels[attribute.key] = {label: attribute.displayName, unit: attribute.unit ?? undefined, order: Object.keys(labels).length};
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

const CATALOG = "/catalog-service";

export async function getProductReviews(productId: string, page = 0, size = 10) {
  const params = new URLSearchParams({page: String(page), size: String(size)});
  return mapProductReviewPage(
    await backendFetch<ProductReviewPageDto>(`${CATALOG}/products/${encodeURIComponent(productId)}/reviews?${params.toString()}`),
  );
}

/** The reviews of the signed-in customer for this product, newest first: pinned above the public list. */
export async function getMyProductReviews(productId: string) {
  return (await backendFetch<ProductReviewDto[]>(`${CATALOG}/products/${encodeURIComponent(productId)}/reviews/mine`)).map(
    mapProductReview,
  );
}

export async function createProductReview(productId: string, request: CreateReviewRequest) {
  const payload = parseRequest(createReviewRequestSchema, request);
  return mapProductReview(
    await backendFetch<ProductReviewDto>(`${CATALOG}/products/${encodeURIComponent(productId)}/reviews`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

/** Spends the single edit of the review; the backend refuses a second edit, one after 30 days, and one on a product no longer on sale. */
export async function updateProductReview(productId: string, reviewId: string, request: EditReviewRequest) {
  const payload = parseRequest(editReviewRequestSchema, request);
  return mapProductReview(
    await backendFetch<ProductReviewDto>(`${CATALOG}/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  );
}

/** Which of the given order lines the customer has reviewed. */
export async function getReviewedOrderItems(orderItemIds: string[]) {
  if (orderItemIds.length === 0) return [];
  const params = new URLSearchParams({orderItemIds: orderItemIds.join(",")});
  return backendFetch<ReviewedOrderItemDto[]>(`${CATALOG}/reviews/mine?${params.toString()}`);
}

/** An order line only knows its variant, so the product (for the review URL and the link to its page) is looked up through it. */
export async function getOrderLineProduct(variantId: string) {
  const variant = await backendFetch<ProductVariantLookupDto>(`${CATALOG}/product-variants/${encodeURIComponent(variantId)}`);
  const product = await backendFetch<OrderLineProductDto>(`${CATALOG}/products/${encodeURIComponent(variant.productId)}`);
  return {id: product.id, name: product.name, seoName: product.seoName};
}
