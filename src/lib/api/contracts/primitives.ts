import {z} from "zod";

/** Shared validation primitives used by feature request contracts. */
export const nonEmptyText = z.string().trim().min(1);
export const optionalText = z.string().trim().transform((value) => value || undefined).optional();
export const uuid = z.uuid();
export const optionalUuid = z.union([uuid, z.literal("")]).transform((value) => value || undefined).optional();
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const optionalDate = z.union([date, z.literal("")]).transform((value) => value || undefined).optional();
export const phone = z.string().regex(/^(0|\+84)[0-9]{9,10}$/);
export const optionalPhone = z.union([phone, z.literal("")]).transform((value) => value || undefined).optional();
export const password = z.string().min(8).regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$/);
export const money = z.number().int().nonnegative();
export const positiveQuantity = z.number().int().positive();

export const optionalEnum = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.union([z.enum(values), z.literal("")]).transform((value) => value || undefined).optional();
