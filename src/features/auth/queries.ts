"use client";

import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {changePassword, getProfile, logout, requestChangePasswordOtp, updateProfile} from "./api";

export const authKeys = {
  profile: ["auth", "profile"] as const,
};

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

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => queryClient.removeQueries({queryKey: authKeys.profile}),
  });
}

export function useChangePassword() {
  return useMutation({mutationFn: changePassword});
}

export function useRequestChangePasswordOtp() {
  return useMutation({mutationFn: requestChangePasswordOtp});
}
