import {backendFetch} from "@/lib/api/client";
import type {
  CheckoutPaymentMethodDto,
  CheckoutShippingMethodDto,
  DiscountPreviewDto,
  OrderDetailDto,
  OrderSummaryPageDto,
  VnpayResultDto,
  VnpayUrlDto,
} from "@/features/orders/contracts/dto";
import {
  mapCheckoutPaymentMethod,
  mapCheckoutShippingMethod,
  mapDiscountPreview,
  mapOrderDetail,
  mapOrderSummaryPage,
} from "@/features/orders/mappers";
import type {CreateOrderRequest, DiscountPreviewRequest} from "@/features/orders/contracts/requests";
import {
  cancelOrderRequestSchema,
  createOrderRequestSchema,
  discountPreviewRequestSchema,
} from "@/features/orders/contracts/requests";
import type {VnpayResult} from "@/features/orders/models";
import {parseRequest} from "@/lib/api/parse-request";

const ORDER = "/order-service";
const PAYMENT = "/payment-service";
const PROMOTION = "/promotion-service";

export type OrderFilters = {
  cursor?: string;
  limit?: number;
  keyword?: string;
  status?: string;
};

export async function createOrder(request: CreateOrderRequest) {
  const payload = parseRequest(createOrderRequestSchema, request);
  return mapOrderDetail(await backendFetch<OrderDetailDto>(`${ORDER}/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}

export async function getOrders(filters: OrderFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return mapOrderSummaryPage(await backendFetch<OrderSummaryPageDto>(
    `${ORDER}/orders${params.size ? `?${params.toString()}` : ""}`,
  ));
}

export async function getOrder(orderId: string) {
  return mapOrderDetail(await backendFetch<OrderDetailDto>(`${ORDER}/orders/${encodeURIComponent(orderId)}`));
}

/** The cancel answer carries no payment attempts, so callers refetch the order instead of using it. */
export async function cancelOrder(orderId: string, reason?: string) {
  const payload = parseRequest(cancelOrderRequestSchema, reason ? {reason} : {});
  await backendFetch<OrderDetailDto>(`${ORDER}/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPaymentMethods() {
  const response = await backendFetch<CheckoutPaymentMethodDto[]>(`${PAYMENT}/payment-methods`);
  return response.map(mapCheckoutPaymentMethod);
}

export async function getShippingMethods() {
  const response = await backendFetch<CheckoutShippingMethodDto[]>(`${ORDER}/shipping-methods`);
  return response.map(mapCheckoutShippingMethod);
}

/** The VNPAY page that takes the payment of an order the customer placed; the browser is sent there. */
export async function createVnpayUrl(paymentId: string) {
  const response = await backendFetch<VnpayUrlDto>(`${PAYMENT}/payments/${encodeURIComponent(paymentId)}/vnpay-url`, {method: "POST"});
  return response.paymentUrl;
}

/** What became of the payment, from the query string VNPAY sent the customer back with (the backend checks its signature). */
export async function getVnpayResult(query: string): Promise<VnpayResult> {
  const response = await backendFetch<VnpayResultDto>(`${PAYMENT}/payments/vnpay/return?${query}`);
  return {paymentId: response.paymentId, orderId: response.orderId, result: response.result as VnpayResult["result"], amount: response.amount ?? 0};
}

/** Prices a cart with the promotion-service, the same call the order makes when it is placed. */
export async function previewDiscounts(request: DiscountPreviewRequest) {
  const payload = parseRequest(discountPreviewRequestSchema, request);
  return mapDiscountPreview(await backendFetch<DiscountPreviewDto>(`${PROMOTION}/discounts/apply`, {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}
