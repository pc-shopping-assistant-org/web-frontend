"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelOrder,
  createOrder,
  createPaymentIntent,
  getOrder,
  getPaymentMethods,
  getOrders,
  getShippingMethods,
  validateDiscount,
  type OrderFilters,
} from "./api";

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
export function usePaymentMethods() {
  return useQuery({
    queryKey: orderKeys.paymentMethods,
    queryFn: getPaymentMethods,
    staleTime: 300_000,
  });
}
export function useShippingMethods() {
  return useQuery({
    queryKey: orderKeys.shippingMethods,
    queryFn: getShippingMethods,
    staleTime: 300_000,
  });
}
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      if (order.id) qc.setQueryData(orderKeys.detail(order.id), order);
    },
  });
}
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      cancelOrder(orderId, reason),
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      if (order.id) qc.setQueryData(orderKeys.detail(order.id), order);
    },
  });
}
export function useValidateDiscount() {
  return useMutation({ mutationFn: validateDiscount });
}
export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: ({ orderId }: { orderId: string }) =>
      createPaymentIntent(orderId),
  });
}
