import {enumValues} from "@/lib/domain/enum-values";

export enum AccountRole {
  Admin = "ROLE_ADMIN",
  Employee = "ROLE_EMPLOYEE",
  Manager = "ROLE_MANAGER",
  LegacyAdmin = "ADMIN",
  LegacyEmployee = "EMPLOYEE",
  LegacyManager = "MANAGER",
}

export enum AccountStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
  Locked = "LOCKED",
  Deleted = "DELETED",
}

export enum Gender {
  Male = "MALE",
  Female = "FEMALE",
  Other = "OTHER",
}

export enum OtpPurpose {
  Registration = "REGISTRATION",
  ForgotPassword = "FORGOT_PASSWORD",
}

export type UserStatus = AccountStatus.Active | AccountStatus.Locked | AccountStatus.Deleted;
export type EmployeeGender = Gender.Male | Gender.Female;

export const ACCOUNT_STATUS_VALUES = enumValues(AccountStatus);
export const USER_STATUS_VALUES = [
  AccountStatus.Active,
  AccountStatus.Locked,
  AccountStatus.Deleted,
] as const;
export const GENDER_VALUES = enumValues(Gender);
export const EMPLOYEE_GENDER_VALUES = [Gender.Male, Gender.Female] as const;
export const OTP_PURPOSE_VALUES = enumValues(OtpPurpose);

/** Messages used by client-only auth flows, separate from API message keys. */
export enum AuthUiMessage {
  OTP_SENT = "OTP_SENT",
}
