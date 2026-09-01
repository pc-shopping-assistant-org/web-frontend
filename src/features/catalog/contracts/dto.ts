import type {BackendSchema} from "@/lib/api/generated/types";

/**
 * Transport shapes generated from the backend OpenAPI snapshot.
 * These types stay inside the adapter/mapper boundary; UI code consumes the
 * feature models exported from `responses.ts` instead.
 */
export type ProductSummaryDto = BackendSchema["ProductSummaryResponse"];
export type ProductDetailDto = BackendSchema["ProductDetailResponse"];
export type ProductVariantDto = BackendSchema["ProductVariantResponse"];
export type ProductImageDto = BackendSchema["ProductImageResponse"];
export type ProductOptionDto = BackendSchema["OptionResponse"];
export type ProductPageDto = BackendSchema["CursorPageResponseProductSummaryResponse"];
export type CategoryDto = BackendSchema["CategoryResponse"];
export type CategoryTreeDto = BackendSchema["CategoryTreeResponse"];
export type BrandDto = BackendSchema["BrandResponse"];
export type SupplierDto = BackendSchema["SupplierResponse"];
export type ReviewDto = BackendSchema["ReviewResponse"];
export type ReviewsPageDto = BackendSchema["CursorPageResponseReviewResponse"];
export type ProductRatingSummaryDto = BackendSchema["ProductRatingSummaryResponse"];
