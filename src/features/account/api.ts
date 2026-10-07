import {backendFetch} from "@/lib/api/client";
import type {CustomerAddressDto} from "@/features/account/contracts/dto";
import {mapCustomerAddress} from "@/features/account/mappers";
import {
  customerAddressRequestSchema,
  type CustomerAddressRequest,
} from "@/features/account/contracts/requests";
import {parseRequest} from "@/lib/api/parse-request";

const ADDRESSES = "/identity-service/users/addresses";

export async function getAddresses() {
  const response = await backendFetch<CustomerAddressDto[]>(ADDRESSES);
  return response.map(mapCustomerAddress);
}

/** The backend makes the first address the default; asking for another one is a second call. */
async function applyDefault(address: CustomerAddressDto, wantDefault: boolean | undefined) {
  if (!wantDefault || address.isDefault) return mapCustomerAddress(address);
  return mapCustomerAddress(await backendFetch<CustomerAddressDto>(`${ADDRESSES}/${encodeURIComponent(address.id)}/default`, {method: "PATCH"}));
}

export async function createAddress(request: CustomerAddressRequest) {
  const {default: wantDefault, ...payload} = parseRequest(customerAddressRequestSchema, request);
  const created = await backendFetch<CustomerAddressDto>(ADDRESSES, {method: "POST", body: JSON.stringify(payload)});
  return applyDefault(created, wantDefault);
}

export async function updateAddress(addressId: string, request: CustomerAddressRequest) {
  const {default: wantDefault, ...payload} = parseRequest(customerAddressRequestSchema, request);
  const updated = await backendFetch<CustomerAddressDto>(`${ADDRESSES}/${encodeURIComponent(addressId)}`, {method: "PUT", body: JSON.stringify(payload)});
  return applyDefault(updated, wantDefault);
}

export async function setDefaultAddress(addressId: string) {
  return mapCustomerAddress(await backendFetch<CustomerAddressDto>(`${ADDRESSES}/${encodeURIComponent(addressId)}/default`, {method: "PATCH"}));
}

export function deleteAddress(addressId: string) {
  return backendFetch<null>(`${ADDRESSES}/${encodeURIComponent(addressId)}`, {method: "DELETE"});
}
