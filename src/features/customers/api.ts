import {backendFetch} from "@/lib/api/client";

import type {CustomerDetailDto, CustomerDto, CustomerPageDto} from "./contracts/dto";
import {mapCustomer, mapCustomerDetail, mapCustomerPage} from "./mappers";

const IDENTITY = "/identity-service";

export type CustomerFilters = {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  /** ISO instants; the backend refuses a range whose start is not before its end. */
  createdFrom?: string;
  createdTo?: string;
};

const customerUrl = (accountId: string) => `${IDENTITY}/customers/${encodeURIComponent(accountId)}`;

/** Customers by page, narrowed by what the employee typed; the empty filters are dropped. */
export async function getCustomers(filters: CustomerFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return mapCustomerPage(await backendFetch<CustomerPageDto>(`${IDENTITY}/customers${params.size ? `?${params.toString()}` : ""}`));
}

/** The customer with the addresses they saved, the default one first. */
export async function getCustomer(accountId: string) {
  return mapCustomerDetail(await backendFetch<CustomerDetailDto>(customerUrl(accountId)));
}

/** Only the account is locked: the profile, the addresses and the orders in progress stay. There is no unlock. */
export async function lockCustomer(accountId: string) {
  return mapCustomer(await backendFetch<CustomerDto>(`${customerUrl(accountId)}/lock`, {method: "POST"}));
}
