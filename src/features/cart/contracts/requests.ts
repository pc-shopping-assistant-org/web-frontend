import {z} from "zod";

import {
  MAX_CART_LINE_QUANTITY,
  positiveQuantity,
  uuid,
} from "@/lib/api/contracts/primitives";

export const addToCartRequestSchema = z.object({
  productVariantId: uuid,
  quantity: positiveQuantity.max(MAX_CART_LINE_QUANTITY),
}).strict();

export const updateCartItemRequestSchema = z.object({
  quantity: positiveQuantity.max(MAX_CART_LINE_QUANTITY),
}).strict();

export type AddToCartRequest = z.infer<typeof addToCartRequestSchema>;
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>;
