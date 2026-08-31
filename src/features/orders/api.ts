import {backendFetch} from "@/lib/api/client";
import type {BackendSchema, DiscountValidation, Order, OrdersPage, PaymentIntent, PaymentMethod} from "@/lib/api/types";

export type OrderFilters = Pick<BackendSchema["OrderFilterRequest"], "cursor" | "limit" | "keyword" | "status">;

export function createOrder(request: BackendSchema["CreateOrderRequest"]) {
  return backendFetch<Order>("/orders", {method: "POST", body: JSON.stringify(request)});
}

export function getOrders(filters: OrderFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "") params.set(key, String(value));
  return backendFetch<OrdersPage>(`/orders/me${params.size ? `?${params.toString()}` : ""}`);
}

export function getOrder(orderId: string) {
  return backendFetch<Order>(`/orders/${encodeURIComponent(orderId)}`);
}

export function cancelOrder(orderId: string, reason?: string) {
  return backendFetch<Order>(`/orders/${encodeURIComponent(orderId)}/cancel`, {method: "PATCH", body: JSON.stringify(reason ? {reason} : {})});
}

export function getPaymentMethods() {
  return backendFetch<PaymentMethod[]>("/payment-methods");
}

export function validateDiscount(request: BackendSchema["ValidateDiscountRequest"]) {
  return backendFetch<DiscountValidation>("/discounts/validate", {method: "POST", body: JSON.stringify(request)});
}

export function createPaymentIntent(orderId: string) {
  return backendFetch<PaymentIntent>("/payments/create-intent", {method: "POST", body: JSON.stringify({orderId, paymentMethod: "STRIPE_CARD"})});
}

export function confirmCodPayment(paymentId: string) {
  return backendFetch<string>(`/payments/${encodeURIComponent(paymentId)}/confirm-cod`, {method: "POST"});
}
