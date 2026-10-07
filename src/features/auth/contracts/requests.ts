import {z} from "zod";

import {GENDER_VALUES} from "@/lib/domain/account-enums";
import {
  nonEmptyText,
  optionalDate,
  optionalEnum,
  optionalUuid,
  password,
  phone,
} from "@/lib/api/contracts/primitives";

export const loginRequestSchema = z.object({
  identifier: nonEmptyText,
  password: z.string().min(1),
}).strict();

export const googleLoginRequestSchema = z.object({
  idToken: nonEmptyText,
}).strict();

export const refreshTokenRequestSchema = z.object({
  refreshToken: nonEmptyText,
}).strict();

export const registerRequestSchema = z.object({
  firstName: nonEmptyText.max(100),
  lastName: nonEmptyText.max(100),
  email: z.email(),
  phone,
  password,
  address: nonEmptyText.max(500),
  gender: optionalEnum(GENDER_VALUES),
  birthday: optionalDate,
}).strict();

export const verifyOtpRequestSchema = z.object({
  email: z.email(),
  otp: z.string().regex(/^\d{6}$/),
}).strict();

export const resendOtpRequestSchema = z.object({
  email: z.email(),
}).strict();

export const forgotPasswordRequestSchema = z.object({
  email: z.email(),
}).strict();

export const resetPasswordRequestSchema = z.object({
  email: z.email(),
  otp: z.string().regex(/^\d{6}$/),
  newPassword: password,
}).strict();

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
}).strict();

export const verifyPasswordChangeRequestSchema = z.object({
  otp: z.string().regex(/^\d{6}$/),
}).strict();

export const updateProfileRequestSchema = z.object({
  firstName: nonEmptyText.max(50),
  lastName: nonEmptyText.max(50),
  phone: phone.optional(),
  gender: optionalEnum(GENDER_VALUES),
  birthday: optionalDate,
  avatarFileId: optionalUuid,
}).strict();

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type GoogleLoginRequest = z.infer<typeof googleLoginRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type VerifyOtpRequest = z.infer<typeof verifyOtpRequestSchema>;
export type ResendOtpRequest = z.infer<typeof resendOtpRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type VerifyPasswordChangeRequest = z.infer<typeof verifyPasswordChangeRequestSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
