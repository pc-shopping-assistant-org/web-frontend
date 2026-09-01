import {backendFetch} from "@/lib/api/client";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ResendOtpRequest,
  UpdateProfileRequest,
  VerifyOtpRequest,
} from "@/features/auth/contracts";
import type {FileResponseDto, AuthResponseDto, UserProfileDto} from "@/features/auth/contracts/dto";
import {mapAuthResponse, mapUserProfile} from "@/features/auth/mappers";
import {mapFileResponse} from "@/features/admin/mappers";
import {
  changePasswordRequestSchema,
  forgotPasswordRequestSchema,
  googleLoginRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  resendOtpRequestSchema,
  resetPasswordRequestSchema,
  updateProfileRequestSchema,
  verifyOtpRequestSchema,
} from "@/features/auth/contracts/requests";
import {parseRequest} from "@/lib/api/parse-request";
import {OtpPurpose} from "@/lib/domain/account-enums";

export async function login(request: LoginRequest) {
  const payload = parseRequest(loginRequestSchema, request);
  return mapAuthResponse(await backendFetch<AuthResponseDto>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}

export async function loginWithGoogle(request: GoogleLoginRequest) {
  const payload = parseRequest(googleLoginRequestSchema, request);
  return mapAuthResponse(await backendFetch<AuthResponseDto>("/auth/google", {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}

export function register(request: RegisterRequest) {
  const payload = parseRequest(registerRequestSchema, request);
  return backendFetch<string>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyRegistrationOtp(request: VerifyOtpRequest) {
  const payload = parseRequest(verifyOtpRequestSchema, {...request, purpose: OtpPurpose.Registration});
  return mapAuthResponse(await backendFetch<AuthResponseDto>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}

export function resendOtp(request: ResendOtpRequest) {
  const payload = parseRequest(resendOtpRequestSchema, request);
  return backendFetch<string>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function requestPasswordReset(request: ForgotPasswordRequest) {
  const payload = parseRequest(forgotPasswordRequestSchema, request);
  return backendFetch<string>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resetPassword(request: ResetPasswordRequest) {
  const payload = parseRequest(resetPasswordRequestSchema, request);
  return backendFetch<string>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return backendFetch<string>("/auth/logout", {method: "POST"});
}

export async function getProfile() {
  return mapUserProfile(await backendFetch<UserProfileDto>("/users/profile/me"));
}

export async function updateProfile(request: UpdateProfileRequest) {
  const payload = parseRequest(updateProfileRequestSchema, request);
  return mapUserProfile(await backendFetch<UserProfileDto>("/users/profile/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  }));
}

export function uploadProfileAvatar(file: globalThis.File) {
  const body = new FormData();
  body.append("file", file);
  return backendFetch<FileResponseDto>(
    "/users/profile/me/avatar",
    {
      method: "POST",
      body,
    },
  ).then(mapFileResponse);
}

export function requestChangePasswordOtp() {
  return backendFetch<string>("/users/profile/change-password/otp", {method: "POST"});
}

export function changePassword(request: ChangePasswordRequest) {
  const payload = parseRequest(changePasswordRequestSchema, request);
  return backendFetch<string>("/users/profile/change-password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
