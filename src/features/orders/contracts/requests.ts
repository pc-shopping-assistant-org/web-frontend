import {z} from "zod";

import {PAYMENT_METHOD_CODE_VALUES, PaymentMethodCode} from "@/lib/domain/commerce-enums";
import {
  money,
  nonEmptyText,
  optionalPhone,
  optionalText,
  optionalUuid,
  positiveQuantity,
  uuid,
} from "@/lib/api/contracts/primitives";

export const orderItemRequestSchema = z.object({
  productVariantId: uuid,
  quantity: positiveQuantity,
}).strict();

export const createOrderRequestSchema = z.object({
  customerAddressId: optionalUuid,
  deliveryAddress: optionalText,
  discountCode: optionalText,
  items: z.array(orderItemRequestSchema).min(1),
  note: optionalText,
  paymentMethod: z.enum(PAYMENT_METHOD_CODE_VALUES),
  recipientName: optionalText,
  recipientPhone: optionalPhone,
  shippingMethodCode: optionalText,
}).strict();

export const cancelOrderRequestSchema = z.object({
  reason: optionalText,
}).strict();

export const validateDiscountRequestSchema = z.object({
  code: nonEmptyText,
  orderAmount: money,
  items: z.array(z.object({
    productVariantId: uuid,
    quantity: positiveQuantity,
    unitPrice: money,
  }).strict()).optional(),
}).strict();

export const createPaymentIntentRequestSchema = z.object({
  orderId: uuid,
  paymentMethod: z.literal(PaymentMethodCode.StripeCard),
}).strict();

export type OrderItemRequest = z.infer<typeof orderItemRequestSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type CancelOrderRequest = z.infer<typeof cancelOrderRequestSchema>;
export type ValidateDiscountRequest = z.infer<typeof validateDiscountRequestSchema>;
export type CreatePaymentIntentRequest = z.infer<typeof createPaymentIntentRequestSchema>;
