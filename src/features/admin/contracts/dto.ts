import type {BackendSchema} from "@/lib/api/generated/types";

/** OpenAPI transport shapes kept inside admin adapters. */
export type AttributeDefinitionDto = BackendSchema["AttributeDefinitionResponse"];
/** The specification form of a category as catalog-service serves it. */
export type CategorySpecsDto = {
  categoryId: string;
  attributes: SpecAttributeDto[];
};
export type SpecAttributeDto = {
  attributeId: string;
  key: string;
  displayName: string;
  dataType: string;
  unit?: string | null;
  allowedValues?: string[] | null;
  required: boolean;
  displayOrder: number;
  inherited?: boolean;
  sourceCategoryId?: string | null;
  sourceCategoryName?: string | null;
};
/** promotion-service discount; `state` is the status combined with the validity period. */
export type DiscountDto = {
  id: string;
  code?: string | null;
  title: string;
  discountType: string;
  value: number;
  applicationScope: string;
  minOrderAmount?: number | null;
  startAt: string;
  endAt: string;
  description?: string | null;
  status: string;
  state: string;
  categoryIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};
/** common-lib PageResponse: zero-based pages. */
export type DiscountsPageDto = {
  content: DiscountDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};
export type FileResponseDto = BackendSchema["FileResponse"];
export type PaymentDetailDto = BackendSchema["PaymentDetailResponse"];
export type PaymentsPageDto = BackendSchema["CursorPageResponsePaymentDetailResponse"];
export type SupplierDto = BackendSchema["SupplierResponse"];
export type SuppliersPageDto = BackendSchema["CursorPageResponseSupplierResponse"];
