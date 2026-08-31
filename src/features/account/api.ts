import {backendFetch} from "@/lib/api/client";
import type {CustomerAddress, CustomerAddressRequest} from "@/lib/api/types";

export function getAddresses() {
  return backendFetch<CustomerAddress[]>("/users/addresses");
}

export function createAddress(request: CustomerAddressRequest) {
  return backendFetch<CustomerAddress>("/users/addresses", {method: "POST", body: JSON.stringify(request)});
}

export function updateAddress(addressId: string, request: CustomerAddressRequest) {
  return backendFetch<CustomerAddress>(`/users/addresses/${encodeURIComponent(addressId)}`, {method: "PUT", body: JSON.stringify(request)});
}

export function setDefaultAddress(addressId: string) {
  return backendFetch<CustomerAddress>(`/users/addresses/${encodeURIComponent(addressId)}/default`, {method: "PATCH"});
}

export function deleteAddress(addressId: string) {
  return backendFetch<string>(`/users/addresses/${encodeURIComponent(addressId)}`, {method: "DELETE"});
}
