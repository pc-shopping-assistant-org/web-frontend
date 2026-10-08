import {backendFetch} from "@/lib/api/client";
import type {CartDto} from "@/features/cart/contracts/dto";
import {mapCart} from "@/features/cart/mappers";
import {
  addToCartRequestSchema,
  type AddToCartRequest,
  type UpdateCartItemRequest,
  updateCartItemRequestSchema,
} from "@/features/cart/contracts";
import {parseRequest} from "@/lib/api/parse-request";

const CART = "/order-service/cart";

export async function getCart() {
  return mapCart(await backendFetch<CartDto>(CART));
}

export async function addToCart(request: AddToCartRequest) {
  const payload = parseRequest(addToCartRequestSchema, request);
  return mapCart(await backendFetch<CartDto>(`${CART}/items`, {method: "POST", body: JSON.stringify(payload)}));
}

export async function updateCartItem(variantId: string, request: UpdateCartItemRequest) {
  const payload = parseRequest(updateCartItemRequestSchema, request);
  return mapCart(await backendFetch<CartDto>(`${CART}/items/${encodeURIComponent(variantId)}`, {method: "PUT", body: JSON.stringify(payload)}));
}

export async function removeCartItem(variantId: string) {
  return mapCart(await backendFetch<CartDto>(`${CART}/items/${encodeURIComponent(variantId)}`, {method: "DELETE"}));
}

export async function clearCart() {
  return mapCart(await backendFetch<CartDto>(CART, {method: "DELETE"}));
}
