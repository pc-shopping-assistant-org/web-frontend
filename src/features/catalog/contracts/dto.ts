import type {BackendSchema} from "@/lib/api/generated/types";

/**
 * Transport shapes generated from the backend OpenAPI snapshot.
 * These types stay inside the adapter/mapper boundary; UI code consumes the
 * feature models exported from `responses.ts` instead.
 */
/** catalog-service product list row; `mainImageUrl` is the main gallery image. */
export type ProductSummaryDto = {
  id: string;
  name: string;
  seoName: string;
  brandId?: string | null;
  brandName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  mainImageUrl?: string | null;
  status: string;
  createdAt?: string;
};
/** An option is a free "name: value" pair such as Color: Blue. */
export type ProductOptionDto = {id: string; name: string; value: string};
export type ProductImageDto = {id: string; fileId: string; url?: string | null; main: boolean};
export type ProductVariantDto = {
  id: string;
  productId: string;
  price: number;
  quantity: number;
  sku: string;
  model?: string | null;
  description?: string | null;
  warrantyMonths?: number | null;
  barcode?: string | null;
  releaseAt?: string | null;
  imageFileId?: string | null;
  imageUrl?: string | null;
  status: string;
  options?: ProductOptionDto[];
  createdAt?: string;
};
export type ProductDetailDto = {
  id: string;
  name: string;
  seoName: string;
  brandId?: string | null;
  brandName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  specifications?: Record<string, unknown>;
  description?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  images?: ProductImageDto[];
  variants?: ProductVariantDto[];
};
/** The catalog-service cursor page: forward only. */
export type ProductPageDto = {
  items: ProductSummaryDto[];
  nextCursor?: string | null;
  hasNext: boolean;
  size: number;
};
/** Products still arrive in the old shape until the product phases are integrated. */
export type LegacyCategoryDto = BackendSchema["CategoryResponse"];
export type LegacyBrandDto = BackendSchema["BrandResponse"];

/** catalog-service category; the list endpoints are flat, the tree endpoint nests `children`. */
export type CategoryDto = {
  id: string;
  name: string;
  seoName: string;
  description?: string | null;
  parentId?: string | null;
  status: string;
  createdAt?: string;
  children?: CategoryDto[];
};
export type CategoryTreeDto = CategoryDto;

/** catalog-service brand with the URL of its logo already resolved. */
export type BrandDto = {
  id: string;
  name: string;
  seoName: string;
  description?: string | null;
  imageFileId?: string | null;
  imageUrl?: string | null;
  status: string;
  createdAt?: string;
};
export type SupplierDto = BackendSchema["SupplierResponse"];
/** A review of a product; {@code reviewerName} is only filled in the public list, the author's own copies leave it empty. */
export type ProductReviewDto = {
  id: string;
  productId: string;
  reviewerName?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
  editedAt?: string | null;
};

/** catalog-service page of the reviews: by page number, with totals. */
export type ProductReviewPageDto = {
  content: ProductReviewDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

/** What the lookup of a variant answers; only its product matters here. */
export type ProductVariantLookupDto = {id: string; productId: string};

/** An order line the customer has already reviewed. */
export type ReviewedOrderItemDto = {orderItemId: string; productId: string; reviewId: string};

/** The product an order line belongs to, as the storefront needs it to review that line. */
export type OrderLineProductDto = {id: string; name: string; seoName: string};

export type ReviewDto = BackendSchema["ReviewResponse"];
export type ReviewsPageDto = BackendSchema["CursorPageResponseReviewResponse"];
