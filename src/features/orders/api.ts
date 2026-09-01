import { backendFetch } from "@/lib/api/client";
import type {
  DiscountValidationDto,
  OrderDto,
  OrdersPageDto,
  PaymentIntentDto,
  PaymentMethodDto,
  ShippingMethodDto,
} from "@/features/orders/contracts/dto";
import {
  mapDiscountValidation,
  mapOrder,
  mapOrdersPage,
  mapPaymentIntent,
  mapPaymentMethod,
  mapShippingMethod,
} from "@/features/orders/mappers";
import type {
  CreateOrderRequest,
  ValidateDiscountRequest,
} from "@/features/orders/contracts/requests";
import {
  cancelOrderRequestSchema,
  createOrderRequestSchema,
  createPaymentIntentRequestSchema,
  validateDiscountRequestSchema,
} from "@/features/orders/contracts/requests";
import {parseRequest} from "@/lib/api/parse-request";
import {PaymentMethodCode} from "@/lib/domain/commerce-enums";

export type OrderFilters = {
  cursor?: string;
  limit?: number;
  keyword?: string;
  status?: string;
};

export async function createOrder(request: CreateOrderRequest) {
  const payload = parseRequest(createOrderRequestSchema, request);
  return mapOrder(await backendFetch<OrderDto>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}

export async function getOrders(filters: OrderFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined && value !== "") params.set(key, String(value));
  const response = await backendFetch<OrdersPageDto>(
    `/orders/me${params.size ? `?${params.toString()}` : ""}`,
  );
  return mapOrdersPage(response);
}

export async function getOrder(orderId: string) {
  return mapOrder(await backendFetch<OrderDto>(`/orders/${encodeURIComponent(orderId)}`));
}

export async function cancelOrder(orderId: string, reason?: string) {
  const payload = parseRequest(cancelOrderRequestSchema, reason ? { reason } : {});
  return mapOrder(await backendFetch<OrderDto>(`/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }));
}

export async function getPaymentMethods() {
  const response = await backendFetch<PaymentMethodDto[]>("/payment-methods");
  return response.map(mapPaymentMethod);
}

export async function getShippingMethods() {
  const response = await backendFetch<ShippingMethodDto[]>("/shipping-methods");
  return response.map(mapShippingMethod);
}

export async function validateDiscount(
  request: ValidateDiscountRequest,
) {
  const payload = parseRequest(validateDiscountRequestSchema, request);
  return mapDiscountValidation(await backendFetch<DiscountValidationDto>("/discounts/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}

export async function createPaymentIntent(
  orderId: string,
  paymentMethod: PaymentMethodCode = PaymentMethodCode.StripeCard,
) {
  const payload = parseRequest(createPaymentIntentRequestSchema, {orderId, paymentMethod});
  return mapPaymentIntent(await backendFetch<PaymentIntentDto>("/payments/create-intent", {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}

export function confirmCodPayment(paymentId: string) {
  return backendFetch<string>(
    `/payments/${encodeURIComponent(paymentId)}/confirm-cod`,
    { method: "POST" },
  );
}
