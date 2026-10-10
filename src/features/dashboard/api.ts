import {backendFetch} from "@/lib/api/client";

import type {
  CustomerSummaryDto,
  OrderDashboardDto,
  OrderStatusCountsDto,
  RevenuePointDto,
  StockSummaryDto,
  TopVariantDto,
} from "./contracts/dto";
import {mapCustomerSummary, mapOrderDashboard, mapRevenuePoint, mapStockSummary, mapTopVariant} from "./mappers";
import type {RevenueGranularity} from "./models";

const ORDER = "/order-service/orders/admin";

/** A range of days, yyyy-MM-dd in the shop's time zone, both ends included. */
export type DateRange = {from?: string; to?: string};

function withQuery(path: string, values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return params.size ? `${path}?${params.toString()}` : path;
}

/** The three dashboard calls are separate: one service down leaves the other two parts of the page. */
export async function getOrderDashboard() {
  return mapOrderDashboard(await backendFetch<OrderDashboardDto>(`${ORDER}/dashboard`));
}

export async function getCustomerSummary() {
  return mapCustomerSummary(await backendFetch<CustomerSummaryDto>("/identity-service/customers/summary"));
}

export async function getStockSummary() {
  return mapStockSummary(await backendFetch<StockSummaryDto>("/catalog-service/product-variants/stock-summary"));
}

export async function getRevenue(range: Required<DateRange>, granularity: RevenueGranularity) {
  const points = await backendFetch<RevenuePointDto[]>(withQuery(`${ORDER}/statistics/revenue`, {...range, granularity}));
  return points.map(mapRevenuePoint);
}

export async function getTopVariants(range: DateRange, limit: number) {
  const items = await backendFetch<TopVariantDto[]>(withQuery(`${ORDER}/statistics/top-variants`, {...range, limit}));
  return items.map(mapTopVariant);
}

export async function getOrderStatusCounts(range: DateRange) {
  return backendFetch<OrderStatusCountsDto>(withQuery(`${ORDER}/statistics/order-status`, {...range}));
}
