import {z} from "zod";

import {
  DISCOUNT_SCOPE_VALUES,
  DISCOUNT_TYPE_VALUES,
  EDITABLE_DISCOUNT_STATUS_VALUES,
  DiscountScope,
  DiscountType,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
} from "@/lib/domain/commerce-enums";
import {USER_STATUS_VALUES} from "@/lib/domain/account-enums";
import {REVIEW_STATUS_VALUES} from "@/lib/domain/catalog-enums";
import {EDITABLE_RESOURCE_STATUS_VALUES} from "@/lib/domain/catalog-enums";
import {
  money,
  nonEmptyText,
  optionalEnum,
  optionalText,
  uuid,
} from "@/lib/api/contracts/primitives";

export const updateOrderStatusRequestSchema = z.object({
  status: z.enum(ORDER_STATUS_VALUES),
  reason: optionalText,
}).strict();

export const updatePaymentStatusRequestSchema = z.object({
  status: z.enum(PAYMENT_STATUS_VALUES),
  providerTransactionCode: optionalText,
  note: optionalText,
}).strict();

export const updateResourceStatusRequestSchema = z.object({
  status: z.enum(EDITABLE_RESOURCE_STATUS_VALUES),
  reason: optionalText,
}).strict();

export const updateAccountStatusRequestSchema = z.object({
  status: z.enum(USER_STATUS_VALUES),
  reason: optionalText,
}).strict();

export const updateDiscountStatusRequestSchema = z.object({
  status: z.enum(EDITABLE_DISCOUNT_STATUS_VALUES),
  reason: optionalText,
}).strict();

export const updateReviewStatusRequestSchema = z.object({
  status: z.enum(REVIEW_STATUS_VALUES),
  reason: optionalText,
}).strict();

export const createDiscountRequestSchema = z.object({
  code: optionalText,
  title: nonEmptyText,
  discountType: z.enum(DISCOUNT_TYPE_VALUES),
  value: z.number().int().positive(),
  applicationScope: z.enum(DISCOUNT_SCOPE_VALUES),
  minOrderAmount: money.optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  description: optionalText,
  appliedCategoryIds: z.array(uuid).optional(),
  appliedVariantIds: z.array(uuid).optional(),
}).superRefine((value, context) => {
  if (value.startAt >= value.endAt) {
    context.addIssue({code: "custom", path: ["endAt"], message: "endAt must be after startAt"});
  }
  if (value.discountType === DiscountType.Percent && value.value > 100) {
    context.addIssue({code: "custom", path: ["value"], message: "Percent discount cannot exceed 100"});
  }
  if (value.applicationScope === DiscountScope.Category && !value.appliedCategoryIds?.length) {
    context.addIssue({code: "custom", path: ["appliedCategoryIds"], message: "At least one category target is required"});
  }
  if (value.applicationScope === DiscountScope.Variant && !value.appliedVariantIds?.length) {
    context.addIssue({code: "custom", path: ["appliedVariantIds"], message: "At least one variant target is required"});
  }
  if (
    [DiscountScope.Order, DiscountScope.AllItems].includes(value.applicationScope) &&
    (value.appliedCategoryIds?.length || value.appliedVariantIds?.length)
  ) {
    context.addIssue({code: "custom", path: ["applicationScope"], message: "This scope cannot have targets"});
  }
  if (value.applicationScope === DiscountScope.Category && value.appliedVariantIds?.length) {
    context.addIssue({code: "custom", path: ["appliedVariantIds"], message: "Category scope cannot have variant targets"});
  }
  if (value.applicationScope === DiscountScope.Variant && value.appliedCategoryIds?.length) {
    context.addIssue({code: "custom", path: ["appliedCategoryIds"], message: "Variant scope cannot have category targets"});
  }
}).strict();

export const updateDiscountRequestSchema = createDiscountRequestSchema.extend({
  status: optionalEnum(EDITABLE_DISCOUNT_STATUS_VALUES),
}).strict();

export const updateReviewRequestSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: optionalText,
}).strict();

export type UpdateOrderStatusRequest = z.infer<typeof updateOrderStatusRequestSchema>;
export type UpdatePaymentStatusRequest = z.infer<typeof updatePaymentStatusRequestSchema>;
export type UpdateResourceStatusRequest = z.infer<typeof updateResourceStatusRequestSchema>;
export type UpdateAccountStatusRequest = z.infer<typeof updateAccountStatusRequestSchema>;
export type UpdateDiscountStatusRequest = z.infer<typeof updateDiscountStatusRequestSchema>;
export type UpdateReviewStatusRequest = z.infer<typeof updateReviewStatusRequestSchema>;
export type CreateDiscountRequest = z.infer<typeof createDiscountRequestSchema>;
export type UpdateDiscountRequest = z.infer<typeof updateDiscountRequestSchema>;
export type UpdateReviewRequest = z.infer<typeof updateReviewRequestSchema>;
