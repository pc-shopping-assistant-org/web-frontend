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
  VerifyPasswordChangeRequest,
} from "@/features/auth/contracts";
import type {AuthResponseDto, MediaFileDto, UserSummaryDto} from "@/features/auth/contracts/dto";
import {mapAuthResponse, mapUploadedImage, mapUserProfile} from "@/features/auth/mappers";
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
  verifyPasswordChangeRequestSchema,
} from "@/features/auth/contracts/requests";
import {parseRequest} from "@/lib/api/parse-request";

const jsonPost = (payload: unknown) => ({method: "POST", body: JSON.stringify(payload)});

export async function login(request: LoginRequest) {
  const payload = parseRequest(loginRequestSchema, request);
  return mapAuthResponse(await backendFetch<AuthResponseDto>("/auth/login", jsonPost(payload)));
}

export async function loginWithGoogle(request: GoogleLoginRequest) {
  const payload = parseRequest(googleLoginRequestSchema, request);
  return mapAuthResponse(await backendFetch<AuthResponseDto>("/auth/google", jsonPost(payload)));
}

export function register(request: RegisterRequest) {
  const payload = parseRequest(registerRequestSchema, request);
  return backendFetch<null>("/auth/register", jsonPost(payload));
}

export async function verifyRegistrationOtp(request: VerifyOtpRequest) {
  const payload = parseRequest(verifyOtpRequestSchema, request);
  return mapAuthResponse(await backendFetch<AuthResponseDto>("/auth/verify-otp", jsonPost(payload)));
}

export function resendOtp(request: ResendOtpRequest) {
  const payload = parseRequest(resendOtpRequestSchema, request);
  return backendFetch<null>("/auth/resend-otp", jsonPost(payload));
}

export function requestPasswordReset(request: ForgotPasswordRequest) {
  const payload = parseRequest(forgotPasswordRequestSchema, request);
  return backendFetch<null>("/auth/forgot-password", jsonPost(payload));
}

export function resetPassword(request: ResetPasswordRequest) {
  const payload = parseRequest(resetPasswordRequestSchema, request);
  return backendFetch<null>("/auth/reset-password", jsonPost(payload));
}

export function logout() {
  return backendFetch<{revoked: boolean}>("/auth/logout", {method: "POST"});
}

export async function getProfile() {
  return mapUserProfile(await backendFetch<UserSummaryDto>("/identity-service/profile"));
}

export async function updateProfile(request: UpdateProfileRequest) {
  const payload = parseRequest(updateProfileRequestSchema, request);
  return mapUserProfile(await backendFetch<UserSummaryDto>("/identity-service/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  }));
}

/** Step 1 of a password change: checks the current password and emails the confirmation OTP. */
export function changePassword(request: ChangePasswordRequest) {
  const payload = parseRequest(changePasswordRequestSchema, request);
  return backendFetch<null>("/auth/change-password", jsonPost(payload));
}

/** Step 2: the OTP applies the new password given in step 1. */
export function verifyPasswordChange(request: VerifyPasswordChangeRequest) {
  const payload = parseRequest(verifyPasswordChangeRequestSchema, request);
  return backendFetch<null>("/auth/verify-password-change", jsonPost(payload));
}

/** Uploads the image to media-service; the returned id is then sent with the profile update. */
export async function uploadAvatar(file: globalThis.File) {
  const body = new FormData();
  body.append("file", file);
  return mapUploadedImage(await backendFetch<MediaFileDto>("/media-service/files", {method: "POST", body}));
}
