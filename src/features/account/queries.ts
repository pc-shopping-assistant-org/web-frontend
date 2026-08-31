"use client";

import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {createAddress, deleteAddress, getAddresses, setDefaultAddress, updateAddress} from "./api";

export const accountKeys = {addresses: ["account", "addresses"] as const};

export function useAddresses() {
  return useQuery({queryKey: accountKeys.addresses, queryFn: getAddresses, retry: false});
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  return () => queryClient.invalidateQueries({queryKey: accountKeys.addresses});
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({mutationFn: createAddress, onSuccess: invalidate(queryClient)});
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({mutationFn: ({addressId, request}: {addressId: string; request: Parameters<typeof updateAddress>[1]}) => updateAddress(addressId, request), onSuccess: invalidate(queryClient)});
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({mutationFn: setDefaultAddress, onSuccess: invalidate(queryClient)});
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({mutationFn: deleteAddress, onSuccess: invalidate(queryClient)});
}
