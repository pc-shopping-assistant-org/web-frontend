import {backendFetch} from "@/lib/api/client";
import type {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ResendOtpRequest,
  UpdateProfileRequest,
  UserProfile,
  VerifyOtpRequest,
} from "@/lib/api/types";

export function login(identifier: string, password: string) {
  return backendFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({identifier, password}),
  });
}

export function register(request: RegisterRequest) {
  return backendFetch<string>("/auth/register", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function verifyRegistrationOtp(request: VerifyOtpRequest) {
  return backendFetch<AuthResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({...request, purpose: "REGISTRATION"}),
  });
}

export function resendOtp(request: ResendOtpRequest) {
  return backendFetch<string>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function requestPasswordReset(request: ForgotPasswordRequest) {
  return backendFetch<string>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function resetPassword(request: ResetPasswordRequest) {
  return backendFetch<string>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function logout() {
  return backendFetch<string>("/auth/logout", {method: "POST"});
}

export function getProfile() {
  return backendFetch<UserProfile>("/users/profile/me");
}

export function updateProfile(request: UpdateProfileRequest) {
  return backendFetch<UserProfile>("/users/profile/me", {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function requestChangePasswordOtp() {
  return backendFetch<string>("/users/profile/change-password/otp", {method: "POST"});
}

export function changePassword(request: ChangePasswordRequest) {
  return backendFetch<string>("/users/profile/change-password", {
    method: "PATCH",
    body: JSON.stringify(request),
  });
}
