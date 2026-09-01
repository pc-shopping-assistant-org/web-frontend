import {backendFetch} from "@/lib/api/client";
import type {CustomerAddressDto} from "@/features/account/contracts/dto";
import {mapCustomerAddress} from "@/features/account/mappers";
import {
  customerAddressRequestSchema,
  type CustomerAddressRequest,
} from "@/features/account/contracts/requests";
import {parseRequest} from "@/lib/api/parse-request";

export async function getAddresses() {
  const response = await backendFetch<CustomerAddressDto[]>("/users/addresses");
  return response.map(mapCustomerAddress);
}

export async function createAddress(request: CustomerAddressRequest) {
  const payload = parseRequest(customerAddressRequestSchema, request);
  return mapCustomerAddress(await backendFetch<CustomerAddressDto>("/users/addresses", {method: "POST", body: JSON.stringify(payload)}));
}

export async function updateAddress(addressId: string, request: CustomerAddressRequest) {
  const payload = parseRequest(customerAddressRequestSchema, request);
  return mapCustomerAddress(await backendFetch<CustomerAddressDto>(`/users/addresses/${encodeURIComponent(addressId)}`, {method: "PUT", body: JSON.stringify(payload)}));
}

export async function setDefaultAddress(addressId: string) {
  return mapCustomerAddress(await backendFetch<CustomerAddressDto>(`/users/addresses/${encodeURIComponent(addressId)}/default`, {method: "PATCH"}));
}

export function deleteAddress(addressId: string) {
  return backendFetch<string>(`/users/addresses/${encodeURIComponent(addressId)}`, {method: "DELETE"});
}
