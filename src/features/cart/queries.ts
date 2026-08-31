"use client";

import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {addToCart, clearCart, getCart, removeCartItem, updateCartItem} from "./api";

export const cartKeys = {all: ["cart"] as const};

export function useCart() {
  return useQuery({queryKey: cartKeys.all, queryFn: getCart});
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({mutationFn: addToCart, onSuccess: (cart) => queryClient.setQueryData(cartKeys.all, cart)});
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({mutationFn: ({variantId, quantity}: {variantId: string; quantity: number}) => updateCartItem(variantId, {quantity}), onSuccess: (cart) => queryClient.setQueryData(cartKeys.all, cart)});
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({mutationFn: removeCartItem, onSuccess: (cart) => queryClient.setQueryData(cartKeys.all, cart)});
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({mutationFn: clearCart, onSuccess: () => queryClient.setQueryData(cartKeys.all, {items: [], totalItems: 0, subtotalAmount: 0})});
}
