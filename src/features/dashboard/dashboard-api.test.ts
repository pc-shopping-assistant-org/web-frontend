import {afterEach, describe, expect, it, vi} from "vitest";

import {getCustomerSummary, getOrderDashboard, getOrderStatusCounts, getRevenue, getStockSummary, getTopVariants} from "./api";

afterEach(() => vi.restoreAllMocks());

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

describe("dashboard api", () => {
  it("reads the three parts of the dashboard from their own services", async () => {
    const fetchMock = stubFetch({revenueToday: 100, revenueThisMonth: 900, ordersByStatus: {COMPLETED: 3, CANCELLED: 0}});
    expect(await getOrderDashboard()).toEqual({revenueToday: 100, revenueThisMonth: 900, ordersByStatus: {COMPLETED: 3, CANCELLED: 0}});
    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/order-service/orders/admin/dashboard");

    stubFetch({totalCustomers: 40, newToday: 1, newThisMonth: 7});
    expect(await getCustomerSummary()).toEqual({totalCustomers: 40, newToday: 1, newThisMonth: 7});

    const stock = stubFetch({lowStockVariants: 2, outOfStockVariants: 1, lowStockThreshold: 5});
    expect(await getStockSummary()).toEqual({lowStockVariants: 2, outOfStockVariants: 1, lowStockThreshold: 5});
    expect(stock.mock.calls[0][0]).toBe("/api/backend/catalog-service/product-variants/stock-summary");
  });

  it("asks for the revenue of a range, by day or by month", async () => {
    const fetchMock = stubFetch([{period: "2026-10-01", revenue: 500, orderCount: 2}]);
    expect(await getRevenue({from: "2026-10-01", to: "2026-10-10"}, "MONTH")).toEqual([
      {period: "2026-10-01", revenue: 500, orderCount: 2},
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/backend/order-service/orders/admin/statistics/revenue?from=2026-10-01&to=2026-10-10&granularity=MONTH",
    );
  });

  it("asks for the best sellers and drops an empty range", async () => {
    const fetchMock = stubFetch([
      {productVariantId: "v1", productName: "RAM", sku: "R-1", variantLabel: null, quantitySold: 4, revenue: 800},
    ]);
    const items = await getTopVariants({from: "2026-10-01", to: ""}, 5);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/order-service/orders/admin/statistics/top-variants?from=2026-10-01&limit=5");
    expect(items[0]).toMatchObject({productVariantId: "v1", variantLabel: undefined, quantitySold: 4});
  });

  it("counts the orders by status over a range, or over all of them", async () => {
    const fetchMock = stubFetch({COMPLETED: 2});
    expect(await getOrderStatusCounts({from: "2026-10-01", to: "2026-10-10"})).toEqual({COMPLETED: 2});
    await getOrderStatusCounts({});
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/backend/order-service/orders/admin/statistics/order-status?from=2026-10-01&to=2026-10-10",
    );
    expect(fetchMock.mock.calls[1][0]).toBe("/api/backend/order-service/orders/admin/statistics/order-status");
  });
});
