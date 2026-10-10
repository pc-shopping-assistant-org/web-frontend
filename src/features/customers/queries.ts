"use client";

import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {getCustomer, getCustomers, lockCustomer, type CustomerFilters} from "./api";

export const customerKeys = {
  all: ["customers"] as const,
  list: (filters: CustomerFilters) => ["customers", "list", filters] as const,
  detail: (accountId: string) => ["customers", "detail", accountId] as const,
};

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => getCustomers(filters),
    retry: false,
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(accountId: string) {
  return useQuery({
    queryKey: customerKeys.detail(accountId),
    queryFn: () => getCustomer(accountId),
    retry: false,
  });
}

/** Refreshed after a refusal too: a customer already locked in another window is refused as locked, and the page should show it. */
export function useLockCustomer(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => lockCustomer(accountId),
    onSettled: () => qc.invalidateQueries({queryKey: customerKeys.all}),
  });
}
