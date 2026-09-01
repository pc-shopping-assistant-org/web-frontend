import {ApiMessageKey} from "@/lib/domain/message-keys";

/** Stable response contract shared by backend and AI BFF calls. */
export const STATIC_MESSAGE_KEYS = ApiMessageKey;

export type MessageKey =
  (typeof STATIC_MESSAGE_KEYS)[keyof typeof STATIC_MESSAGE_KEYS] | string;

export type ApiError = {
  field?: string | null;
  code?: string | null;
  message?: string | null;
};

export type ApiResponse<T> = {
  data: T | null;
  message: MessageKey;
  errors: ApiError[];
};
