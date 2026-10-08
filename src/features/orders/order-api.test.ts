import {afterEach, describe, expect, it, vi} from "vitest";

import {cancelOrder, createOrder, getOrder, getOrders, createVnpayUrl, getShippingMethods, getVnpayResult, previewDiscounts} from "./api";

afterEach(() => vi.restoreAllMocks());

const ID = "00000000-0000-4000-8000-000000000001";
const ID2 = "00000000-0000-4000-8000-000000000002";

function stubFetch(payload: unknown) {
  const fetchMock = vi.fn().mockImplementation(async () =>
    new Response(JSON.stringify({data: payload, message: "SUCCESS", errors: []}), {status: 200, headers: {"content-type": "application/json"}}),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const order = {
  id: ID, invoiceNumber: "INV-ABCDEFGHJK", status: "PENDING_CONFIRMATION", cancellationReason: null,
  recipientName: "A", recipientPhone: "0912345678", deliveryAddress: "1 Street", note: null,
  shippingMethodId: ID2, paymentMethodId: ID2,
  items: [{id: "i1", productVariantId: ID, productName: "Card", sku: "S1", variantLabel: "Color: Blue", quantity: 2, unitPrice: 1000, discountAmount: 100, lineTotal: 1900}],
  subtotalAmount: 1900, discountAmount: 0, shippingFee: 30000, totalAmount: 31900,
  payments: [{id: "p1", orderId: ID, paymentMethodId: ID2, amount: 31900, status: "PENDING", paidAt: null, createdAt: null}],
  createdAt: "2026-10-08T00:00:00Z", deliveredAt: null,
};

describe("order api", () => {
  it("places an order with the ids and the idempotency key", async () => {
    const fetchMock = stubFetch(order);

    const placed = await createOrder({idempotencyKey: "k1", shippingMethodId: ID2, paymentMethodId: ID2, customerAddressId: ID, discountCode: "", note: " leave "});

    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/order-service/orders");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({idempotencyKey: "k1", shippingMethodId: ID2, paymentMethodId: ID2, customerAddressId: ID, note: "leave"});
    expect(placed).toMatchObject({invoiceNumber: "INV-ABCDEFGHJK", totalAmount: 31900});
    expect(placed.items[0]).toMatchObject({variantLabel: "Color: Blue", lineTotal: 1900});
  });

  it("does not call the backend for a delivery that is neither a saved address nor a full recipient", async () => {
    const fetchMock = stubFetch(order);

    await expect(createOrder({idempotencyKey: "k1", shippingMethodId: ID2, paymentMethodId: ID2, recipientName: "A"})).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lists by cursor with the status and keyword filters", async () => {
    const fetchMock = stubFetch({items: [{id: ID, invoiceNumber: "INV-1", status: "CONFIRMED", totalAmount: 5, itemCount: 2, firstProductName: "Card", createdAt: "2026-10-08T00:00:00Z"}], nextCursor: "next", hasNext: true, size: 1});

    const page = await getOrders({limit: 10, status: "CONFIRMED", keyword: "INV-1", cursor: ""});

    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/order-service/orders?limit=10&status=CONFIRMED&keyword=INV-1");
    expect(page).toMatchObject({hasNext: true, nextCursor: "next"});
    expect(page.items[0]).toMatchObject({invoiceNumber: "INV-1", itemCount: 2, firstProductName: "Card"});
  });

  it("reads one order, cancels it with a POST and reads the shipping and discount endpoints", async () => {
    const fetchMock = stubFetch(order);
    expect((await getOrder(ID)).payments[0]).toMatchObject({status: "PENDING", amount: 31900});
    await cancelOrder(ID, "changed my mind");
    expect(fetchMock.mock.calls[1]).toEqual([`/api/backend/order-service/orders/${ID}/cancel`, expect.objectContaining({method: "POST", body: JSON.stringify({reason: "changed my mind"})})]);

    stubFetch([{id: ID, code: "STANDARD", name: "Standard", fee: 30000}]);
    expect((await getShippingMethods())[0]).toEqual({id: ID, code: "STANDARD", name: "Standard", fee: 30000});

    const preview = stubFetch({discountId: null, discountAmount: 0, orderDiscountId: null, orderDiscountAmount: 500, itemDiscounts: [{productVariantId: ID, discountId: ID2, discountAmount: 100}]});
    const priced = await previewDiscounts({code: "FE10", orderAmount: 2000, items: [{productVariantId: ID, quantity: 2, unitPrice: 1000, categoryId: ID2}]});
    expect(preview.mock.calls[0][0]).toBe("/api/backend/promotion-service/discounts/apply");
    expect(priced).toEqual({itemDiscountAmount: 100, orderDiscountAmount: 500, lineDiscounts: {[ID]: 100}});
  });

  it("asks for the VNPAY page of a payment and reads the result of the return", async () => {
    const url = stubFetch({paymentUrl: "https://sandbox.vnpayment.vn/pay?x=1"});
    expect(await createVnpayUrl(ID)).toBe("https://sandbox.vnpayment.vn/pay?x=1");
    expect(url.mock.calls[0]).toEqual([`/api/backend/payment-service/payments/${ID}/vnpay-url`, expect.objectContaining({method: "POST"})]);

    const result = stubFetch({paymentId: ID, orderId: ID2, result: "PAID", amount: 31900});
    expect(await getVnpayResult("vnp_TxnRef=a&vnp_SecureHash=b")).toEqual({paymentId: ID, orderId: ID2, result: "PAID", amount: 31900});
    expect(result.mock.calls[0][0]).toBe("/api/backend/payment-service/payments/vnpay/return?vnp_TxnRef=a&vnp_SecureHash=b");
  });
});
