"use client";

import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {
  activateEmployee,
  createEmployee,
  deactivateEmployee,
  deleteEmployee,
  getEmployee,
  getEmployees,
  lockEmployee,
  updateEmployee,
  type EmployeeFilters,
} from "./api";
import type {UpdateEmployeeRequest} from "./contracts/requests";

export const employeeKeys = {
  all: ["employees"] as const,
  list: (filters: EmployeeFilters) => ["employees", "list", filters] as const,
  detail: (accountId: string) => ["employees", "detail", accountId] as const,
};

export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: () => getEmployees(filters),
    retry: false,
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(accountId: string) {
  return useQuery({
    queryKey: employeeKeys.detail(accountId),
    queryFn: () => getEmployee(accountId),
    retry: false,
  });
}

/** A new employee has to show in the list. */
export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => qc.invalidateQueries({queryKey: employeeKeys.all}),
  });
}

export function useUpdateEmployee(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateEmployeeRequest) => updateEmployee(accountId, request),
    onSuccess: () => qc.invalidateQueries({queryKey: employeeKeys.all}),
  });
}

/** Refreshed after a refusal too: an employee already locked in another window is refused as locked, and the page should show it. */
export function useLockEmployee(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => lockEmployee(accountId),
    onSettled: () => qc.invalidateQueries({queryKey: employeeKeys.all}),
  });
}

/** The three other moves of an employee between states. Refreshed after a refusal too, as for the lock. */
export function useEmployeeState(accountId: string) {
  const qc = useQueryClient();
  const settled = () => qc.invalidateQueries({queryKey: employeeKeys.all});
  return {
    deactivate: useMutation({mutationFn: () => deactivateEmployee(accountId), onSettled: settled}),
    activate: useMutation({mutationFn: () => activateEmployee(accountId), onSettled: settled}),
    remove: useMutation({mutationFn: () => deleteEmployee(accountId), onSettled: settled}),
  };
}
