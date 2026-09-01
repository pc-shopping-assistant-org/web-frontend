import {z} from "zod";

import {STATIC_MESSAGE_KEYS, type ApiError, type ApiResponse, type MessageKey} from "./contracts/common";

const apiErrorSchema = z
  .object({
    field: z.string().nullable().optional(),
    code: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
  })
  .passthrough();

const apiEnvelopeSchema = z
  .object({
    data: z.unknown().nullable(),
    message: z.string().min(1),
    errors: z.array(apiErrorSchema),
  })
  .passthrough();

export class ApiClientError extends Error {
  readonly status: number;
  readonly messageKey: MessageKey;
  readonly errors: ApiError[];

  constructor(status: number, messageKey: MessageKey, errors: ApiError[] = []) {
    super(messageKey);
    this.name = "ApiClientError";
    this.status = status;
    this.messageKey = messageKey;
    this.errors = errors;
  }
}

export function parseApiResponse(value: unknown): ApiResponse<unknown> {
  const parsed = apiEnvelopeSchema.safeParse(value);
  if (!parsed.success) {
    throw new ApiClientError(502, STATIC_MESSAGE_KEYS.SERVICE_UNAVAILABLE, [
      {code: "MALFORMED_ENVELOPE", message: "Upstream response does not match the API envelope."},
    ]);
  }

  return {
    data: parsed.data.data,
    message: parsed.data.message,
    errors: parsed.data.errors,
  };
}

export function normalizeMessage(value: unknown, fallback: MessageKey = STATIC_MESSAGE_KEYS.UNKNOWN): MessageKey {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

export function envelope<T>(data: T | null, message: MessageKey = STATIC_MESSAGE_KEYS.SUCCESS, errors: ApiError[] = []): ApiResponse<T> {
  return {data, message, errors};
}
