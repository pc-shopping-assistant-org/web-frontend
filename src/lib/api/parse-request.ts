import {z} from "zod";

import {ApiClientError} from "./envelope";
import type {ApiError} from "./contracts/common";
import {ApiMessageKey} from "@/lib/domain/message-keys";

/**
 * Validate a request at the feature/BFF boundary while preserving the same
 * static message-key contract used for upstream API failures.
 */
export function parseRequest<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const errors: ApiError[] = result.error.issues.map((issue) => ({
    field: issue.path.length ? issue.path.join(".") : null,
    code: issue.code,
    message: issue.message,
  }));
  throw new ApiClientError(400, ApiMessageKey.VALIDATION_ERROR, errors);
}
