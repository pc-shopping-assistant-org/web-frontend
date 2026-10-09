import {describe, expect, it} from "vitest";

import {addToCartRequestSchema} from "@/features/cart/contracts/requests";
import {loginRequestSchema} from "@/features/auth/contracts/requests";
import {parseRequest} from "./parse-request";
import {createDiscountRequestSchema} from "@/features/admin/contracts/commerce";
import {createOrderRequestSchema, discountPreviewRequestSchema} from "@/features/orders/contracts/requests";
import {chatRequestSchema, compareRequestSchema, evaluateRequestSchema} from "@/features/assistant/contracts/requests";
import {ApiMessageKey} from "@/lib/domain/message-keys";
import {DiscountScope, DiscountType} from "@/lib/domain/commerce-enums";

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

  it("rejects invalid cart quantities and incomplete orders before the BFF call", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(addToCartRequestSchema.safeParse({productVariantId: "not-a-uuid", quantity: 0}).success).toBe(false);
    const order = {idempotencyKey: "k1", shippingMethodId: id, paymentMethodId: id};
    // no saved address and no typed-in recipient
    expect(createOrderRequestSchema.safeParse(order).success).toBe(false);
    // a saved address, or the whole recipient, is enough; a mix is not
    expect(createOrderRequestSchema.safeParse({...order, customerAddressId: id}).success).toBe(true);
    expect(createOrderRequestSchema.safeParse({...order, recipientName: "A", recipientPhone: "0912345678", deliveryAddress: "1 Street"}).success).toBe(true);
    expect(createOrderRequestSchema.safeParse({...order, customerAddressId: id, recipientName: "A"}).success).toBe(false);
    expect(createOrderRequestSchema.safeParse({...order, recipientName: "A", recipientPhone: "123", deliveryAddress: "1 Street"}).success).toBe(false);
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
    expect(createDiscountRequestSchema.safeParse({...base, categoryIds: [categoryId]}).success).toBe(true);
    expect(createDiscountRequestSchema.safeParse({...base, value: 101, categoryIds: [categoryId]}).success).toBe(false);
    expect(createDiscountRequestSchema.safeParse({...base, applicationScope: DiscountScope.Order, categoryIds: [categoryId]}).success).toBe(false);
  });

  it("prices a cart only with real line items", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(discountPreviewRequestSchema.safeParse({orderAmount: 1000, items: []}).success).toBe(false);
    expect(discountPreviewRequestSchema.safeParse({code: "FE10", orderAmount: 1000, items: [{productVariantId: id, quantity: 1, unitPrice: 1000}]}).success).toBe(true);
  });

  it("matches the AI request contract instead of accepting arbitrary IDs", () => {
    const productId = "550e8400-e29b-41d4-a716-446655440000";
    expect(chatRequestSchema.safeParse({message: "find a laptop"}).success).toBe(true);
    expect(compareRequestSchema.safeParse({product_ids: [productId, productId]}).success).toBe(false);
    expect(evaluateRequestSchema.safeParse({product_id: "not-a-uuid"}).success).toBe(false);
  });
});
