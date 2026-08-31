import type {components as AiComponents, paths as AiPaths} from "@/lib/api/generated/ai";
import type {components as BackendComponents, paths as BackendPaths} from "@/lib/api/generated/backend";

export type BackendSchema = BackendComponents["schemas"];
export type AiSchema = AiComponents["schemas"];
export type BackendPath = BackendPaths;
export type AiPath = AiPaths;

export type ProductSummary = BackendSchema["ProductSummaryResponse"];
export type ProductDetail = BackendSchema["ProductDetailResponse"];
export type ProductVariant = BackendSchema["ProductVariantResponse"];
export type ProductImage = BackendSchema["ProductImageResponse"];
export type ProductOption = BackendSchema["OptionResponse"];
export type ProductPage = BackendSchema["CursorPageResponseProductSummaryResponse"];
export type Cart = BackendSchema["CartResponse"];
export type CartItem = BackendSchema["CartItemResponse"];
export type AuthResponse = BackendSchema["AuthResponse"];
export type LoginRequest = BackendSchema["LoginRequest"];
export type RegisterRequest = BackendSchema["RegisterRequest"];

export type BackendApiError = BackendSchema["ApiError"];
export type AiApiError = AiSchema["ErrorDetail"];

export const STATIC_MESSAGE_KEYS = {
  SUCCESS: "SUCCESS",
  CREATED: "CREATED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  PRODUCT_VARIANT_NOT_FOUND: "PRODUCT_VARIANT_NOT_FOUND",
  CART_NOT_FOUND: "CART_NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  AI_BACKEND_UNAVAILABLE: "AI_BACKEND_UNAVAILABLE",
  UNKNOWN: "UNKNOWN",
} as const;

export type MessageKey = (typeof STATIC_MESSAGE_KEYS)[keyof typeof STATIC_MESSAGE_KEYS] | string;

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

export type AuthTokenPair = Pick<AuthResponse, "accessToken" | "refreshToken" | "expiresIn" | "tokenType">;
