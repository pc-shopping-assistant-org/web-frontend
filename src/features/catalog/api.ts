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

const CATALOG = "/catalog-service";

export async function getProductReviews(productId: string, page = 0, size = 10) {
  const params = new URLSearchParams({page: String(page), size: String(size)});
  return mapProductReviewPage(await backendFetch<ProductReviewPageDto>(
    `${CATALOG}/products/${encodeURIComponent(productId)}/reviews?${params.toString()}`,
  ));
}

/** The reviews of the signed-in customer for this product, newest first: pinned above the public list. */
export async function getMyProductReviews(productId: string) {
  return (await backendFetch<ProductReviewDto[]>(`${CATALOG}/products/${encodeURIComponent(productId)}/reviews/mine`)).map(mapProductReview);
}

export async function createProductReview(productId: string, request: CreateReviewRequest) {
  const payload = parseRequest(createReviewRequestSchema, request);
  return mapProductReview(await backendFetch<ProductReviewDto>(`${CATALOG}/products/${encodeURIComponent(productId)}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}

/** Spends the single edit of the review; the backend refuses a second edit, one after 30 days, and one on a product no longer on sale. */
export async function updateProductReview(productId: string, reviewId: string, request: EditReviewRequest) {
  const payload = parseRequest(editReviewRequestSchema, request);
  return mapProductReview(await backendFetch<ProductReviewDto>(
    `${CATALOG}/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`,
    {method: "PATCH", body: JSON.stringify(payload)},
  ));
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
