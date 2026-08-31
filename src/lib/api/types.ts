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
export type UserProfile = BackendSchema["UserProfileResponse"];
export type UserSummary = BackendSchema["UserSummaryResponse"];
export type CustomerAddress = BackendSchema["CustomerAddressResponse"];
export type CustomerAddressRequest = BackendSchema["CustomerAddressRequest"];
export type Category = BackendSchema["CategoryResponse"];
export type CategoryTree = BackendSchema["CategoryTreeResponse"];
export type Brand = BackendSchema["BrandResponse"];
export type Order = BackendSchema["OrderDetailResponse"];
export type OrdersPage = BackendSchema["CursorPageResponseOrderDetailResponse"];
export type CustomersPage = BackendSchema["CursorPageResponseCustomerDetailResponse"];
export type EmployeesPage = BackendSchema["CursorPageResponseEmployeeDetailResponse"];
export type DiscountsPage = BackendSchema["CursorPageResponseDiscountSummaryResponse"];
export type SuppliersPage = BackendSchema["CursorPageResponseSupplierResponse"];
export type PaymentsPage = BackendSchema["CursorPageResponsePaymentDetailResponse"];
export type AdminReviewPage = BackendSchema["CursorPageResponseReviewResponse"];
export type Invoice = BackendSchema["InvoiceResponse"];
export type InvoicesPage = BackendSchema["CursorPageResponseInvoiceResponse"];
export type Role = BackendSchema["RoleResponse"];
export type Option = BackendSchema["OptionResponse"];
export type DashboardOverview = BackendSchema["DashboardOverviewResponse"];
export type OrderStatusStat = BackendSchema["OrderStatusStatResponse"];
export type OrderItem = BackendSchema["OrderItemDetailResponse"];
export type PaymentMethod = BackendSchema["PaymentMethodResponse"];
export type PaymentSummary = BackendSchema["PaymentSummaryResponse"];
export type PaymentIntent = BackendSchema["PaymentIntentResponse"];
export type DiscountValidation = BackendSchema["DiscountValidationResponse"];
export type Review = BackendSchema["ReviewResponse"];
export type ReviewsPage = BackendSchema["CursorPageResponseReviewResponse"];
export type LoginRequest = BackendSchema["LoginRequest"];
export type RegisterRequest = BackendSchema["RegisterRequest"];
export type UpdateProfileRequest = BackendSchema["UpdateProfileRequest"];
export type CreateOrderRequest = BackendSchema["CreateOrderRequest"];
export type CreateReviewRequest = BackendSchema["CreateReviewRequest"];

// These payloads intentionally mirror the current backend DTO contract. The
// generated snapshot kept an older `ResendOtpRequest.status` shape, so the
// adapter types live here until the backend OpenAPI snapshot is refreshed.
export type ResendOtpRequest = {email: string; purpose: "REGISTRATION" | "FORGOT_PASSWORD"};
export type ForgotPasswordRequest = {email?: string; phone?: string};
export type ResetPasswordRequest = {email?: string; phone?: string; otp: string; newPassword: string};
export type ChangePasswordRequest = {oldPassword: string; newPassword: string; otp: string};
export type AddToCartRequest = {productVariantId: string; quantity: number};
export type UpdateCartItemRequest = {quantity: number};
export type VerifyOtpRequest = {email: string; otp: string; purpose?: "REGISTRATION"};

export type BackendApiError = BackendSchema["ApiError"];
export type AiApiError = AiSchema["ErrorDetail"];

export const STATIC_MESSAGE_KEYS = {
  SUCCESS: "SUCCESS",
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  DELETED: "DELETED",
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  MISSING_REQUIRED_PARAMETER: "MISSING_REQUIRED_PARAMETER",
  MALFORMED_JSON: "MALFORMED_JSON",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE",
  NOT_FOUND: "NOT_FOUND",
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",
  CUSTOMER_NOT_FOUND: "CUSTOMER_NOT_FOUND",
  CATEGORY_NOT_FOUND: "CATEGORY_NOT_FOUND",
  BRAND_NOT_FOUND: "BRAND_NOT_FOUND",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  PRODUCT_VARIANT_NOT_FOUND: "PRODUCT_VARIANT_NOT_FOUND",
  ATTRIBUTE_NOT_FOUND: "ATTRIBUTE_NOT_FOUND",
  DISCOUNT_NOT_FOUND: "DISCOUNT_NOT_FOUND",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  OPTION_NOT_FOUND: "OPTION_NOT_FOUND",
  IMAGE_NOT_FOUND: "IMAGE_NOT_FOUND",
  SUPPLIER_NOT_FOUND: "SUPPLIER_NOT_FOUND",
  ADDRESS_NOT_FOUND: "ADDRESS_NOT_FOUND",
  CART_NOT_FOUND: "CART_NOT_FOUND",
  CONFLICT: "CONFLICT",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  PHONE_ALREADY_EXISTS: "PHONE_ALREADY_EXISTS",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  DISCOUNT_EXPIRED: "DISCOUNT_EXPIRED",
  INVALID_ORDER_STATE_TRANSITION: "INVALID_ORDER_STATE_TRANSITION",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
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
