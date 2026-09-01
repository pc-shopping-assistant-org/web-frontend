import type {BackendSchema} from "@/lib/api/generated/types";

/** OpenAPI transport shapes kept inside order/payment adapters. */
export type OrderDto = BackendSchema["OrderDetailResponse"];
export type OrdersPageDto = BackendSchema["CursorPageResponseOrderDetailResponse"];
export type OrderItemDto = BackendSchema["OrderItemDetailResponse"];
export type PaymentMethodDto = BackendSchema["PaymentMethodResponse"];
export type ShippingMethodDto = BackendSchema["ShippingMethodResponse"];
export type PaymentSummaryDto = BackendSchema["PaymentSummaryResponse"];
export type PaymentIntentDto = BackendSchema["PaymentIntentResponse"];
export type DiscountValidationDto = BackendSchema["DiscountValidationResponse"];
export type InvoiceDto = BackendSchema["InvoiceResponse"];
export type InvoicesPageDto = BackendSchema["CursorPageResponseInvoiceResponse"];
