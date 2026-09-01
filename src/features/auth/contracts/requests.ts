import {z} from "zod";

import {
  GENDER_VALUES,
  OtpPurpose,
} from "@/lib/domain/account-enums";
import {
  nonEmptyText,
  optionalDate,
  optionalEnum,
  optionalText,
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
  fullName: nonEmptyText.min(2),
  email: z.email(),
  phone,
  password,
  address: nonEmptyText.min(5),
  gender: optionalEnum(GENDER_VALUES),
  birthday: optionalDate,
}).strict();

export const verifyOtpRequestSchema = z.object({
  email: z.email(),
  otp: z.string().regex(/^\d{6}$/),
  purpose: z.literal(OtpPurpose.Registration).optional(),
}).strict();

export const resendOtpRequestSchema = z.object({
  email: z.email(),
  purpose: z.enum([OtpPurpose.Registration, OtpPurpose.ForgotPassword]),
}).strict();

const identifierSchema = z.object({
  email: z.email().optional(),
  phone: phone.optional(),
}).refine((value) => Boolean(value.email) !== Boolean(value.phone), {
  message: "Exactly one of email or phone is required",
});

export const forgotPasswordRequestSchema = identifierSchema.strict();

export const resetPasswordRequestSchema = identifierSchema.extend({
  otp: z.string().regex(/^\d{6}$/),
  newPassword: password,
}).strict();

export const changePasswordRequestSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: password,
  otp: z.string().regex(/^\d{6}$/),
}).strict();

export const updateProfileRequestSchema = z.object({
  fullName: nonEmptyText.min(2),
  email: z.email().optional(),
  phone: phone.optional(),
  address: optionalText,
  avatarFileId: optionalUuid,
  gender: optionalEnum(GENDER_VALUES),
  birthday: optionalDate,
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
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
