import {z} from "zod";

import {
  money,
  nonEmptyText,
  optionalPhone,
  optionalText,
  optionalUuid,
  positiveQuantity,
  uuid,
} from "@/lib/api/contracts/primitives";

/** Delivery is a saved address or the recipient typed in, never a mix (the backend rejects both). */
export const createOrderRequestSchema = z.object({
  idempotencyKey: nonEmptyText.max(100),
  shippingMethodId: uuid,
  paymentMethodId: uuid,
  customerAddressId: optionalUuid,
  recipientName: optionalText,
  recipientPhone: optionalPhone,
  deliveryAddress: optionalText,
  discountCode: optionalText,
  note: optionalText,
}).strict().superRefine((value, context) => {
  const typedIn = [value.recipientName, value.recipientPhone, value.deliveryAddress];
  if (value.customerAddressId) {
    if (typedIn.some(Boolean)) context.addIssue({code: "custom", path: ["customerAddressId"], message: "Use a saved address or type the recipient, not both"});
  } else if (!typedIn.every(Boolean)) {
    context.addIssue({code: "custom", path: ["recipientName"], message: "Provide a saved address or the recipient name, phone and address"});
  }
});

export const cancelOrderRequestSchema = z.object({
  reason: optionalText,
}).strict();

/** What the promotion-service needs to price a cart: the lines with their category, and an optional voucher. */
export const discountPreviewRequestSchema = z.object({
  code: optionalText,
  orderAmount: money,
  items: z.array(z.object({
    productVariantId: uuid,
    quantity: positiveQuantity,
    unitPrice: money,
    categoryId: optionalUuid,
  }).strict()).min(1),
}).strict();

export type CreateOrderRequest = z.input<typeof createOrderRequestSchema>;
export type CancelOrderRequest = z.infer<typeof cancelOrderRequestSchema>;
export type DiscountPreviewRequest = z.input<typeof discountPreviewRequestSchema>;
