"use client";

import {useMutation, useQuery, useQueryClient, type QueryClient} from "@tanstack/react-query";

import {cartKeys} from "@/features/cart/queries";

import {changePassword, getProfile, logout, requestChangePasswordOtp, updateProfile, uploadProfileAvatar} from "./api";

export const authKeys = {
  profile: ["auth", "profile"] as const,
};

// A cart/profile fetch started under the previous identity (guest session or
// a different account) can still be in flight when the identity changes.
// invalidateQueries alone would let that stale request's response win the
// race, since React Query treats an in-flight fetch as already satisfying
// the invalidation. Cancelling first forces every subsequent read to be a
// fresh request made with the new cookies.
export async function resyncIdentityCaches(queryClient: QueryClient) {
  await Promise.all([
    queryClient.cancelQueries({queryKey: authKeys.profile}),
    queryClient.cancelQueries({queryKey: cartKeys.all}),
  ]);
  queryClient.removeQueries({queryKey: authKeys.profile});
  queryClient.removeQueries({queryKey: cartKeys.all});
  await Promise.all([
    queryClient.invalidateQueries({queryKey: authKeys.profile}),
    queryClient.invalidateQueries({queryKey: cartKeys.all}),
  ]);
}

export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile,
    queryFn: getProfile,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => queryClient.setQueryData(authKeys.profile, profile),
  });
}

export function useUploadProfileAvatar() {
  return useMutation({ mutationFn: uploadProfileAvatar });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      void resyncIdentityCaches(queryClient);
    },
  });
}

export function useChangePassword() {
  return useMutation({mutationFn: changePassword});
}

export function useRequestChangePasswordOtp() {
  return useMutation({mutationFn: requestChangePasswordOtp});
}
