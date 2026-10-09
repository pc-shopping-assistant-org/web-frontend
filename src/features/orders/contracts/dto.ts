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

/** order-service payment attempt of an order, as the payment-service reports it. */
export type OrderPaymentDto = {
  id: string;
  orderId?: string | null;
  paymentMethodId?: string | null;
  amount: number;
  status: string;
  paidAt?: string | null;
  createdAt?: string | null;
};

/** An order line exactly as it was when the order was placed. */
export type OrderLineDto = {
  id: string;
  productVariantId?: string | null;
  productName?: string | null;
  sku?: string | null;
  variantLabel?: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
};

export type OrderDetailDto = {
  id: string;
  invoiceNumber: string;
  status: string;
  cancellationReason?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  deliveryAddress?: string | null;
  note?: string | null;
  shippingMethodId?: string | null;
  paymentMethodId?: string | null;
  items: OrderLineDto[];
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  payments?: OrderPaymentDto[] | null;
  createdAt?: string | null;
  deliveredAt?: string | null;
};

export type OrderSummaryDto = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  firstProductName?: string | null;
  createdAt?: string | null;
};

/** order-service keyset page: forward only. */
export type OrderSummaryPageDto = {
  items: OrderSummaryDto[];
  nextCursor?: string | null;
  hasNext: boolean;
  size: number;
};

/** One row of the order list of the shop. */
export type AdminOrderSummaryDto = {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  status: string;
  totalAmount: number;
  itemCount: number;
  firstProductName?: string | null;
  createdAt?: string | null;
};

/** order-service page of the shop: by page number, with totals. */
export type AdminOrderPageDto = {
  content: AdminOrderSummaryDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

/** {@code changedBy} is the employee who made the change, null when the customer or the system did. */
export type OrderStatusChangeDto = {
  fromStatus?: string | null;
  toStatus: string;
  changedBy?: string | null;
  reason?: string | null;
  createdAt?: string | null;
};

export type AdminOrderDetailDto = OrderDetailDto & {
  customerId?: string | null;
  statusHistory?: OrderStatusChangeDto[] | null;
};

export type OrderStatusDto = {
  id: string;
  invoiceNumber: string;
  status: string;
  cancellationReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type VnpayUrlDto = {paymentUrl: string};
/** PAID, FAILED, or CANCELLED when the customer left VNPAY without paying (the payment stays payable). */
export type VnpayResultDto = {paymentId: string; orderId: string; result: string; amount?: number | null};

export type CheckoutPaymentMethodDto = {id: string; code: string; name: string};
export type CheckoutShippingMethodDto = {id: string; code: string; name: string; fee: number};

/** promotion-service answer for a cart: per-line discounts plus the voucher on the order. */
export type DiscountPreviewDto = {
  discountId?: string | null;
  discountAmount: number;
  orderDiscountId?: string | null;
  orderDiscountAmount: number;
  itemDiscounts: {productVariantId: string; discountId: string; discountAmount: number}[];
};
