import {afterEach, describe, expect, it, vi} from "vitest";

import {addToCart, clearCart, getCart, removeCartItem, updateCartItem} from "./api";

afterEach(() => vi.restoreAllMocks());

const VARIANT = "00000000-0000-4000-8000-000000000001";
const cart = {
  id: "c1",
  items: [
    {productVariantId: VARIANT, productId: "p1", productName: "Card", sku: "S1", model: "M", variantLabel: "Color: Blue", imageUrl: "http://img/a.png", price: 1000, quantity: 2, subtotal: 2000, stockQuantity: 5, available: true},
    {productVariantId: "v2", quantity: 1, subtotal: 0, available: false},
  ],
  totalItems: 2,
  subtotalAmount: 2000,
};

function stubFetch(payload: unknown = cart) {
  const fetchMock = vi.fn().mockImplementation(async () =>
    new Response(JSON.stringify({data: payload, message: "SUCCESS", errors: []}), {status: 200, headers: {"content-type": "application/json"}}),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("cart api", () => {
  it("reads the cart from order-service and keeps unavailable lines flagged", async () => {
    const fetchMock = stubFetch();

    const result = await getCart();

    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/order-service/cart");
    expect(result.items[0]).toMatchObject({price: 1000, stockQuantity: 5, available: true, variantLabel: "Color: Blue"});
    expect(result.items[1]).toMatchObject({available: false, price: 0, productName: ""});
    expect(result).toMatchObject({totalItems: 2, subtotalAmount: 2000});
  });

  it("adds, updates, removes and clears through the same cart path", async () => {
    const fetchMock = stubFetch();

    await addToCart({productVariantId: VARIANT, quantity: 1});
    await updateCartItem(VARIANT, {quantity: 3});
    await removeCartItem(VARIANT);
    await clearCart();

    expect(fetchMock.mock.calls.map((call) => `${call[1].method} ${call[0]}`)).toEqual([
      "POST /api/backend/order-service/cart/items",
      `PUT /api/backend/order-service/cart/items/${VARIANT}`,
      `DELETE /api/backend/order-service/cart/items/${VARIANT}`,
      "DELETE /api/backend/order-service/cart",
    ]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({productVariantId: VARIANT, quantity: 1});
  });

  it("rejects a non-positive quantity before calling the backend", async () => {
    const fetchMock = stubFetch();

    await expect(updateCartItem(VARIANT, {quantity: 0})).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("cart line limit", () => {
  it("rejects more than 9999 units of a variant before calling the backend", async () => {
    const fetchMock = stubFetch();

    await expect(addToCart({productVariantId: VARIANT, quantity: 10000})).rejects.toThrow();
    await expect(updateCartItem(VARIANT, {quantity: 10000})).rejects.toThrow();
    await addToCart({productVariantId: VARIANT, quantity: 9999});

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
