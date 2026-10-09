"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {cartKeys} from "@/features/cart/queries";

import {
  advanceOrder,
  cancelOrder,
  cancelOrderAsAdmin,
  createOrder,
  createVnpayUrl,
  getAdminOrder,
  getAdminOrders,
  getOrder,
  getOrders,
  getPaymentMethods,
  getVnpayResult,
  getShippingMethods,
  previewDiscounts,
  type AdminOrderFilters,
  type OrderFilters,
} from "./api";
import type {DiscountPreviewRequest} from "./contracts/requests";

export const orderKeys = {
  all: ["orders"] as const,
  list: (filters: OrderFilters) => ["orders", filters] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
  paymentMethods: ["orders", "payment-methods"] as const,
  shippingMethods: ["orders", "shipping-methods"] as const,
};

export function useOrders(filters: OrderFilters = {}, enabled = true) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => getOrders(filters),
    retry: false,
    enabled,
    placeholderData: keepPreviousData,
  });
}
export function useOrder(orderId: string, enabled = true) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrder(orderId),
    enabled: Boolean(orderId) && enabled,
    retry: false,
  });
}
export function usePaymentMethods(enabled = true) {
  return useQuery({
    queryKey: orderKeys.paymentMethods,
    queryFn: getPaymentMethods,
    staleTime: 300_000,
    enabled,
  });
}
export function useShippingMethods(enabled = true) {
  return useQuery({
    queryKey: orderKeys.shippingMethods,
    queryFn: getShippingMethods,
    staleTime: 300_000,
    enabled,
  });
}
/** The backend empties the cart when the order is placed, so the cart cache is refreshed too. */
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      qc.invalidateQueries({ queryKey: cartKeys.all });
      qc.setQueryData(orderKeys.detail(order.id), order);
    },
  });
}
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      cancelOrder(orderId, reason),
    // also after a refusal: the order has usually changed under the customer
    onSettled: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });
}
export function useAdminOrders(filters: AdminOrderFilters = {}) {
  return useQuery({
    queryKey: ["orders", "admin", "list", filters],
    queryFn: () => getAdminOrders(filters),
    retry: false,
    placeholderData: keepPreviousData,
  });
}
export function useAdminOrder(orderId: string) {
  return useQuery({
    queryKey: ["orders", "admin", "detail", orderId],
    queryFn: () => getAdminOrder(orderId),
    enabled: Boolean(orderId),
    retry: false,
  });
}
/** A status change also moves the dashboards, and after a refusal the order has usually changed under the employee. */
function useAdminOrderMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => Promise.all([
      qc.invalidateQueries({ queryKey: orderKeys.all }),
      qc.invalidateQueries({ queryKey: ["admin"] }),
    ]),
  });
}
export function useAdvanceOrder() {
  return useAdminOrderMutation(({ orderId, status }: { orderId: string; status: string }) => advanceOrder(orderId, status));
}
export function useCancelOrderAsAdmin() {
  return useAdminOrderMutation(({ orderId, reason }: { orderId: string; reason: string }) => cancelOrderAsAdmin(orderId, reason));
}
/** Asks for the VNPAY pay URL of a payment; the caller sends the browser there. */
export function useCreateVnpayUrl() {
  return useMutation({ mutationFn: createVnpayUrl });
}
/** The outcome VNPAY reported for the customer who just came back; the order changed, so its caches are refreshed. */
export function useVnpayResult(query: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["orders", "vnpay-result", query],
    queryFn: async () => {
      const result = await getVnpayResult(query);
      // not awaited and not this query itself: it would wait for its own refetch
      void qc.invalidateQueries({ queryKey: orderKeys.all, predicate: (entry) => entry.queryKey[1] !== "vnpay-result" });
      return result;
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
/** Item discounts always, and the voucher when a code is given; a rejected code is the query error. */
export function useDiscountPreview(request: DiscountPreviewRequest | null) {
  return useQuery({
    queryKey: ["orders", "discount-preview", request],
    queryFn: () => previewDiscounts(request!),
    enabled: request !== null,
    retry: false,
  });
}
