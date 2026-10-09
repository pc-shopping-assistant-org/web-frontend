"use client";

import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {orderKeys} from "@/features/orders/queries";

import {
  getAdminPaymentMethods,
  getAdminPayments,
  updateAdminPaymentStatus,
  type AdminPaymentFilters,
} from "./api";

export function useAdminPayments(filters: AdminPaymentFilters = {}) {
  return useQuery({
    queryKey: ["payments", "admin", "list", filters],
    queryFn: () => getAdminPayments(filters),
    retry: false,
    placeholderData: keepPreviousData,
  });
}

export function useAdminPaymentMethods() {
  return useQuery({
    queryKey: ["payments", "admin", "methods"],
    queryFn: getAdminPaymentMethods,
    retry: false,
  });
}

/** The order shows its payments, so it is refreshed too, and after a refusal the payment has usually changed under the employee. */
export function useUpdateAdminPaymentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({paymentId, status}: {paymentId: string; status: string}) => updateAdminPaymentStatus(paymentId, status),
    onSettled: () => Promise.all([
      qc.invalidateQueries({queryKey: ["payments", "admin", "list"]}),
      qc.invalidateQueries({queryKey: orderKeys.all}),
      qc.invalidateQueries({queryKey: ["admin"]}),
    ]),
  });
}
