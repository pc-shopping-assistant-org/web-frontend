import {z} from "zod";

import {EMPLOYEE_GENDER_VALUES} from "@/lib/domain/account-enums";

/** Limits of identity-service; the employee table only keeps MALE and FEMALE. */
export const EMPLOYEE_NAME_MAX_LENGTH = 100;
export const EMPLOYEE_ADDRESS_MAX_LENGTH = 255;
export const EMPLOYEE_PASSWORD_MIN_LENGTH = 8;
export const EMPLOYEE_PASSWORD_MAX_LENGTH = 100;
const PHONE_PATTERN = /^(0|\+84)[0-9]{9,10}$/;
const PASSWORD_PATTERN = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

const email = z.string().trim().pipe(z.email());
const phone = z.string().trim().regex(PHONE_PATTERN);
const name = z.string().trim().min(1).max(EMPLOYEE_NAME_MAX_LENGTH);
const gender = z.enum(EMPLOYEE_GENDER_VALUES);
const birthday = z.iso.date().refine((value) => value < new Date().toISOString().slice(0, 10));
const address = z.string().trim().max(EMPLOYEE_ADDRESS_MAX_LENGTH);
const avatarFileId = z.uuid();

/** The role is fixed to employee by the backend, so it is not a field. */
export const createEmployeeRequestSchema = z
  .object({
    email,
    phone,
    password: z.string().min(EMPLOYEE_PASSWORD_MIN_LENGTH).max(EMPLOYEE_PASSWORD_MAX_LENGTH).regex(PASSWORD_PATTERN),
    firstName: name,
    lastName: name,
    gender,
    birthday: birthday.optional(),
    address: address.optional(),
    avatarFileId: avatarFileId.optional(),
  })
  .strict();

/** A field left out keeps its value; an edit that changes nothing is not sent. */
export const updateEmployeeRequestSchema = z
  .object({
    email: email.optional(),
    phone: phone.optional(),
    firstName: name.optional(),
    lastName: name.optional(),
    gender: gender.optional(),
    birthday: birthday.optional(),
    address: address.optional(),
    avatarFileId: avatarFileId.optional(),
  })
  .strict()
  .refine((request) => Object.values(request).some((value) => value !== undefined));

export type CreateEmployeeRequest = z.input<typeof createEmployeeRequestSchema>;
export type UpdateEmployeeRequest = z.input<typeof updateEmployeeRequestSchema>;
