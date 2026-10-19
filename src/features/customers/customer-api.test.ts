import {afterEach, describe, expect, it, vi} from "vitest";

import {getCustomer, getCustomers, lockCustomer} from "./api";

afterEach(() => vi.restoreAllMocks());

const ID = "00000000-0000-4000-8000-000000000001";

function stubFetch(payload: unknown) {
  const fetchMock = vi
    .fn()
    .mockImplementation(
      async () =>
        new Response(JSON.stringify({data: payload, message: "SUCCESS", errors: []}), {
          status: 200,
          headers: {"content-type": "application/json"},
        }),
    );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const customer = {
  accountId: ID,
  email: "cust1@pcshop.local",
  phone: "0900000011",
  status: "ACTIVE",
  firstName: "An",
  lastName: "Nguyen",
  gender: "FEMALE",
  birthday: null,
  avatarFileId: null,
  avatarUrl: null,
  createdAt: "2026-10-08T00:00:00Z",
};

describe("customer api", () => {
  it("lists customers by page with the filters the employee typed, and drops the empty ones", async () => {
    const fetchMock = stubFetch({content: [customer], page: 1, size: 20, totalElements: 41, totalPages: 3, last: false});
    const page = await getCustomers({
      page: 1,
      size: 20,
      keyword: "an",
      status: "LOCKED",
      createdFrom: "2026-10-01T00:00:00Z",
      createdTo: "2026-10-09T00:00:00Z",
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/backend/identity-service/customers?page=1&size=20&keyword=an&status=LOCKED&createdFrom=2026-10-01T00%3A00%3A00Z&createdTo=2026-10-09T00%3A00%3A00Z",
    );
    expect(page).toMatchObject({page: 1, totalPages: 3, last: false});
    expect(page.items[0]).toMatchObject({accountId: ID, fullName: "Nguyen An", birthday: undefined, avatarUrl: undefined});

    await getCustomers({keyword: "", status: undefined});
    expect(fetchMock.mock.calls[1][0]).toBe("/api/backend/identity-service/customers");
  });

  it("reads one customer with the saved addresses", async () => {
    const fetchMock = stubFetch({
      ...customer,
      addresses: [{id: "a1", recipientName: "An", phone: "0900000011", addressLine: "1 Le Loi", isDefault: true}],
    });
    expect(await getCustomer(ID)).toMatchObject({accountId: ID, addresses: [{id: "a1", addressLine: "1 Le Loi", isDefault: true}]});
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/backend/identity-service/customers/${ID}`);
  });

  it("shows a customer without addresses as an empty list", async () => {
    stubFetch({...customer, addresses: null});
    expect((await getCustomer(ID)).addresses).toEqual([]);
  });

  it("locks with a POST", async () => {
    const fetchMock = stubFetch({...customer, status: "LOCKED"});
    expect(await lockCustomer(ID)).toMatchObject({status: "LOCKED"});
    expect(fetchMock.mock.calls[0]).toEqual([
      `/api/backend/identity-service/customers/${ID}/lock`,
      expect.objectContaining({method: "POST"}),
    ]);
  });
});
