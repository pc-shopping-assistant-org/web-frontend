"use client";

import {keepPreviousData, useQuery} from "@tanstack/react-query";

import {
  getCustomerSummary,
  getOrderDashboard,
  getOrderStatusCounts,
  getRevenue,
  getStockSummary,
  getTopVariants,
  type DateRange,
} from "./api";
import type {RevenueGranularity} from "./models";

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

export const useOrderDashboard = () => useQuery({queryKey: ["dashboard", "orders"], queryFn: getOrderDashboard, retry: false});

export const useCustomerSummary = () => useQuery({queryKey: ["dashboard", "customers"], queryFn: getCustomerSummary, retry: false});

export const useStockSummary = () => useQuery({queryKey: ["dashboard", "stock"], queryFn: getStockSummary, retry: false});

export const useRevenue = (range: Required<DateRange>, granularity: RevenueGranularity) =>
  useQuery({
    queryKey: ["dashboard", "revenue", range, granularity],
    queryFn: () => getRevenue(range, granularity),
    retry: false,
    placeholderData: keepPreviousData,
  });

export const useTopVariants = (range: DateRange, limit: number) =>
  useQuery({
    queryKey: ["dashboard", "top-variants", range, limit],
    queryFn: () => getTopVariants(range, limit),
    retry: false,
    placeholderData: keepPreviousData,
  });

export const useOrderStatusCounts = (range: DateRange) =>
  useQuery({
    queryKey: ["dashboard", "order-status", range],
    queryFn: () => getOrderStatusCounts(range),
    retry: false,
    placeholderData: keepPreviousData,
  });
