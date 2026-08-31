import {backendFetch} from "@/lib/api/client";
import type {AddToCartRequest, Cart, UpdateCartItemRequest} from "@/lib/api/types";

export function getCart() {
  return backendFetch<Cart>("/cart");
}

export function addToCart(request: AddToCartRequest) {
  return backendFetch<Cart>("/cart/items", {method: "POST", body: JSON.stringify(request)});
}

export function updateCartItem(variantId: string, request: UpdateCartItemRequest) {
  return backendFetch<Cart>(`/cart/items/${encodeURIComponent(variantId)}`, {method: "PUT", body: JSON.stringify(request)});
}

export function removeCartItem(variantId: string) {
  return backendFetch<Cart>(`/cart/items/${encodeURIComponent(variantId)}`, {method: "DELETE"});
}

export function clearCart() {
  return backendFetch<string>("/cart", {method: "DELETE"});
}
