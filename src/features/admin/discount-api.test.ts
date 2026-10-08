import {afterEach, describe, expect, it, vi} from "vitest";

import {DiscountScope, DiscountStatus, DiscountType} from "@/lib/domain/commerce-enums";

import {createDiscount, deleteDiscount, getDiscounts, updateDiscount} from "./api";

afterEach(() => vi.restoreAllMocks());

function stubFetch(...payloads: unknown[]) {
  const queue = [...payloads];
  const fetchMock = vi.fn().mockImplementation(async () =>
    new Response(JSON.stringify({data: queue.shift() ?? null, message: "SUCCESS", errors: []}), {
      status: 200,
      headers: {"content-type": "application/json"},
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const discount = (status: string, state = "RUNNING") => ({
  id: "d1", code: "SAVE10", title: "Save", discountType: "PERCENT", value: 10, applicationScope: "ORDER", minOrderAmount: null,
  startAt: "2026-01-01T00:00:00Z", endAt: "2026-12-31T00:00:00Z", status, state, categoryIds: [],
});
const definition = {
  title: "Save", discountType: DiscountType.Percent, value: 10, applicationScope: DiscountScope.Order,
  startAt: "2026-01-01T00:00:00.000Z", endAt: "2026-12-31T00:00:00.000Z",
};

describe("admin discounts", () => {
  it("lists by zero-based page and state and maps the page", async () => {
    const fetchMock = stubFetch({content: [discount("ACTIVE")], page: 1, size: 20, totalElements: 21, totalPages: 2, last: true});

    const page = await getDiscounts({page: 1, size: 20, state: "RUNNING"});

    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/promotion-service/discounts?page=1&size=20&state=RUNNING");
    expect(page).toMatchObject({page: 1, totalPages: 2, last: true});
    expect(page.items[0]).toMatchObject({state: "RUNNING", minOrderAmount: 0});
  });

  it("sends category targets as categoryIds and rejects a code outside the order scope", async () => {
    const fetchMock = stubFetch(discount("ACTIVE"));
    const category = "00000000-0000-4000-8000-0000000000c1";

    await createDiscount({...definition, applicationScope: DiscountScope.Category, categoryIds: [category]});
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).categoryIds).toEqual([category]);

    expect(() => createDiscount({...definition, applicationScope: DiscountScope.AllItems, code: "X"})).toThrow();
    expect(() => createDiscount({...definition, applicationScope: DiscountScope.Category})).toThrow();
  });

  it("changes the status with a second call only when it differs", async () => {
    const unchanged = stubFetch(discount("ACTIVE"));
    await updateDiscount("d1", {...definition, status: DiscountStatus.Active});
    expect(unchanged).toHaveBeenCalledTimes(1);

    const changed = stubFetch(discount("ACTIVE"), discount("INACTIVE", "LOCKED"));
    const result = await updateDiscount("d1", {...definition, status: DiscountStatus.Inactive});
    expect(changed.mock.calls.map((call) => `${call[1].method} ${call[0]}`)).toEqual([
      "PUT /api/backend/promotion-service/discounts/d1",
      "PATCH /api/backend/promotion-service/discounts/d1/status",
    ]);
    expect(result.state).toBe("LOCKED");
  });

  it("sends a cleared code as a blank string so the backend removes it", async () => {
    const fetchMock = stubFetch(discount("ACTIVE"));

    await updateDiscount("d1", {...definition, applicationScope: DiscountScope.AllItems});

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).code).toBe("");
  });

  it("deletes through promotion-service", async () => {
    const fetchMock = stubFetch(null);
    await deleteDiscount("d1");
    expect(fetchMock.mock.calls[0]).toEqual(["/api/backend/promotion-service/discounts/d1", expect.objectContaining({method: "DELETE"})]);
  });
});
