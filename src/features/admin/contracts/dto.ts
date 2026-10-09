import type {BackendSchema} from "@/lib/api/generated/types";

/** OpenAPI transport shapes kept inside admin adapters. */
export type AttributeDefinitionDto = BackendSchema["AttributeDefinitionResponse"];
export type AttributeSchemaItemDto = BackendSchema["AttributeSchemaItem"];
export type CategoryAttributeGroupDto = BackendSchema["CategoryAttributeGroupResponse"];
export type CategoryAttributeDto = BackendSchema["CategoryAttributeResponse"];
/** The specification form of a category as catalog-service serves it. */
export type CategorySpecsDto = {
  categoryId: string;
  groups: GroupSchemaItemDto[];
};
export type GroupSchemaItemDto = {
  id: string;
  name: string;
  displayOrder: number;
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
};
export type CustomerDetailDto = BackendSchema["CustomerDetailResponse"];
export type CustomerOrderSummaryDto = BackendSchema["CustomerOrderSummaryResponse"];
export type CustomersPageDto = BackendSchema["CursorPageResponseCustomerDetailResponse"];
export type DashboardOverviewDto = BackendSchema["DashboardOverviewResponse"];
export type OrderStatusStatDto = BackendSchema["OrderStatusStatResponse"];
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
export type EmployeeDetailDto = BackendSchema["EmployeeDetailResponse"];
export type EmployeesPageDto = BackendSchema["CursorPageResponseEmployeeDetailResponse"];
export type FileResponseDto = BackendSchema["FileResponse"];
export type PaymentDetailDto = BackendSchema["PaymentDetailResponse"];
export type PaymentsPageDto = BackendSchema["CursorPageResponsePaymentDetailResponse"];
export type RoleDto = BackendSchema["RoleResponse"];
export type OptionDto = BackendSchema["OptionResponse"];
export type RevenueChartDataDto = BackendSchema["RevenueChartDataResponse"];
export type RevenueChartPointDto = BackendSchema["RevenueChartPointResponse"];
export type SupplierDto = BackendSchema["SupplierResponse"];
export type SuppliersPageDto = BackendSchema["CursorPageResponseSupplierResponse"];
export type TopSellingProductDto = BackendSchema["TopSellingProductResponse"];
