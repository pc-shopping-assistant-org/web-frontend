import {describe, expect, it} from "vitest";

import {addToCartRequestSchema} from "@/features/cart/contracts/requests";
import {loginRequestSchema} from "@/features/auth/contracts/requests";
import {parseRequest} from "./parse-request";
import {createDiscountRequestSchema} from "@/features/admin/contracts/commerce";
import {createOrderRequestSchema, createPaymentIntentRequestSchema} from "@/features/orders/contracts/requests";
import {chatRequestSchema, compareRequestSchema, evaluateRequestSchema} from "@/features/assistant/contracts/requests";
import {ApiMessageKey} from "@/lib/domain/message-keys";
import {DiscountScope, DiscountType, PaymentMethodCode} from "@/lib/domain/commerce-enums";

describe("request schemas", () => {
  it("keeps the login payload explicit", () => {
    expect(loginRequestSchema.parse({identifier: "buyer@example.com", password: "secret"})).toEqual({
      identifier: "buyer@example.com",
      password: "secret",
    });
    expect(loginRequestSchema.safeParse({identifier: "", password: "secret"}).success).toBe(false);
  });

  it("maps client validation failures to the stable API message key", () => {
    expect(() => parseRequest(loginRequestSchema, {identifier: "", password: ""})).toThrowError(
      expect.objectContaining({messageKey: ApiMessageKey.VALIDATION_ERROR, status: 400}),
    );
  });

  it("rejects invalid cart and order quantities before the BFF call", () => {
    expect(addToCartRequestSchema.safeParse({productVariantId: "not-a-uuid", quantity: 0}).success).toBe(false);
    expect(createOrderRequestSchema.safeParse({
      items: [{productVariantId: "not-a-uuid", quantity: 0}],
      paymentMethod: PaymentMethodCode.Cod,
    }).success).toBe(false);
  });

  it("enforces discount type and scope invariants", () => {
    const base = {
      title: "Summer promotion",
      discountType: DiscountType.Percent,
      value: 10,
      applicationScope: DiscountScope.Category,
      startAt: "2026-09-01T00:00:00.000Z",
      endAt: "2026-10-01T00:00:00.000Z",
    };
    expect(createDiscountRequestSchema.safeParse(base).success).toBe(false);
    const categoryId = "550e8400-e29b-41d4-a716-446655440000";
    expect(createDiscountRequestSchema.safeParse({...base, appliedCategoryIds: [categoryId]}).success).toBe(true);
    expect(createDiscountRequestSchema.safeParse({...base, value: 101, appliedCategoryIds: [categoryId]}).success).toBe(false);
    expect(createDiscountRequestSchema.safeParse({...base, applicationScope: DiscountScope.Order, appliedCategoryIds: [categoryId]}).success).toBe(false);
  });

  it("keeps payment protocol values explicit", () => {
    const orderId = "550e8400-e29b-41d4-a716-446655440000";
    expect(createPaymentIntentRequestSchema.safeParse({
      orderId,
      paymentMethod: PaymentMethodCode.StripeCard,
    }).success).toBe(true);
    expect(createPaymentIntentRequestSchema.safeParse({
      orderId,
      paymentMethod: PaymentMethodCode.Cod,
    }).success).toBe(false);
    expect(createOrderRequestSchema.safeParse({
      items: [{productVariantId: orderId, quantity: 1}],
      paymentMethod: "UNKNOWN_METHOD",
    }).success).toBe(false);
  });

  it("matches the AI request contract instead of accepting arbitrary IDs", () => {
    const productId = "550e8400-e29b-41d4-a716-446655440000";
    expect(chatRequestSchema.safeParse({message: "find a laptop"}).success).toBe(true);
    expect(compareRequestSchema.safeParse({product_ids: [productId, productId]}).success).toBe(false);
    expect(evaluateRequestSchema.safeParse({product_id: "not-a-uuid"}).success).toBe(false);
  });
});
