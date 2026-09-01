import {z} from "zod";

import {
  positiveQuantity,
  uuid,
} from "@/lib/api/contracts/primitives";

export const addToCartRequestSchema = z.object({
  productVariantId: uuid,
  quantity: positiveQuantity,
}).strict();

export const updateCartItemRequestSchema = z.object({
  quantity: positiveQuantity,
}).strict();

export type AddToCartRequest = z.infer<typeof addToCartRequestSchema>;
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>;
