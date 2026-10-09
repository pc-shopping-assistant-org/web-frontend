import {afterEach, describe, expect, it, vi} from "vitest";

import {getAdminPaymentMethods, getAdminPayments, updateAdminPaymentStatus} from "./api";

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

const payment = {
  id: ID, orderId: ID2, customerId: ID2, paymentMethodId: ID, amount: 31900, status: "PAID",
  providerTransactionCode: "TXN1", paidAt: "2026-10-08T00:00:00Z", createdAt: "2026-10-08T00:00:00Z", updatedAt: null, updatedBy: null,
};

describe("payment api", () => {
  it("lists payments by page with the filters the shop typed and drops the empty ones", async () => {
    const fetchMock = stubFetch({content: [payment], page: 1, size: 20, totalElements: 41, totalPages: 3, last: false});
    const page = await getAdminPayments({page: 1, size: 20, transactionCode: "TXN", customerName: "", status: "PAID", createdFrom: "2026-10-01T00:00:00Z"});
    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/payment-service/payments/admin?page=1&size=20&transactionCode=TXN&status=PAID&createdFrom=2026-10-01T00%3A00%3A00Z");
    expect(page).toMatchObject({page: 1, totalPages: 3, last: false});
    expect(page.items[0]).toMatchObject({id: ID, orderId: ID2, amount: 31900, providerTransactionCode: "TXN1", updatedBy: undefined});
  });

  it("settles a payment with a PATCH and refuses any other status before it is sent", async () => {
    const fetchMock = stubFetch(payment);
    await updateAdminPaymentStatus(ID, "REFUNDED");
    expect(fetchMock.mock.calls[0]).toEqual([`/api/backend/payment-service/payments/admin/${ID}/status`, expect.objectContaining({method: "PATCH", body: JSON.stringify({status: "REFUNDED"})})]);

    await expect(updateAdminPaymentStatus(ID, "FAILED")).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reads the payment methods the shop has set up", async () => {
    stubFetch([{id: ID, code: "COD", name: "Cash on delivery", status: "ACTIVE"}]);
    expect(await getAdminPaymentMethods()).toEqual([{id: ID, code: "COD", name: "Cash on delivery", status: "ACTIVE"}]);
  });
});
