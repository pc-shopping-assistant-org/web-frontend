export type {
  AiPath,
  AiSchema,
  BackendPath,
  BackendSchema,
} from "@/lib/api/generated/types";
export {STATIC_MESSAGE_KEYS} from "@/lib/api/contracts/common";
export type {ApiError, ApiResponse, MessageKey} from "@/lib/api/contracts/common";

export type {
  CustomerAddress,
} from "@/features/account/contracts/responses";
export type {
  CustomerAddressRequest,
} from "@/features/account/contracts/requests";
export type {
  AddToCartRequest,
  UpdateCartItemRequest,
} from "@/features/cart/contracts/requests";
export type {
  Cart,
  CartItem,
} from "@/features/cart/contracts/responses";
export type {
  ChatRequest,
  CompareRequest,
  ConsultRequest,
  EvaluateRequest,
  SemanticSearchRequest,
} from "@/features/assistant/contracts/requests";
export type {
  ChatData,
  CompareData,
  ConsultData,
  EvaluateData,
  SearchData,
} from "@/features/assistant/contracts/responses";
export type {
  AuthResponse,
  AuthTokenPair,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ResendOtpRequest,
  UpdateProfileRequest,
  UserProfile,
  UserSummary,
  VerifyOtpRequest,
} from "@/features/auth/contracts";
export type {
  Brand,
  Category,
  CategoryTree,
  CreateReviewRequest,
  ProductDetail,
  ProductImage,
  ProductOption,
  ProductPage,
  ProductRatingSummary,
  ProductSummary,
  ProductVariant,
  Review,
  ReviewsPage,
} from "@/features/catalog/contracts";
export type {
  CancelOrderRequest,
  CreateOrderRequest,
  CreatePaymentIntentRequest,
  DiscountValidation,
  Invoice,
  InvoicesPage,
  Order,
  OrderItem,
  OrdersPage,
  PaymentIntent,
  PaymentMethod,
  PaymentSummary,
  ShippingMethod,
  ValidateDiscountRequest,
} from "@/features/orders/contracts";
export type {
  AdminReviewPage,
  CategoryAttribute,
  CategoryAttributeGroup,
  CategorySpecs,
  CustomersPage,
  DashboardOverview,
  DiscountDetail,
  DiscountsPage,
  EmployeeDetail,
  EmployeesPage,
  FileResponse,
  Option,
  OrderStatusStat,
  PaymentDetail,
  PaymentsPage,
  RevenueChartData,
  Role,
  Supplier,
  SuppliersPage,
  TopSellingProduct,
} from "@/features/admin/contracts";
export type {
  AnalyticsDateRangeRequest,
  AssignAttributeRequest,
  CreateAttributeDefinitionRequest,
  CreateBrandRequest,
  CreateCategoryGroupRequest,
  CreateCategoryRequest,
  CreateDiscountRequest,
  CreateEmployeeRequest,
  CreateOptionRequest,
  CreateProductImageRequest,
  CreateProductRequest,
  CreateProductVariantRequest,
  CreateSupplierRequest,
  UpdateAccountStatusRequest,
  UpdateAttributeDefinitionRequest,
  UpdateBrandRequest,
  UpdateCategoryGroupRequest,
  UpdateCategoryRequest,
  UpdateDiscountRequest,
  UpdateDiscountStatusRequest,
  UpdateEmployeeRequest,
  UpdateOptionRequest,
  UpdateOrderStatusRequest,
  UpdatePaymentStatusRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
  UpdateResourceStatusRequest,
  UpdateReviewRequest,
  UpdateReviewStatusRequest,
  UpdateSupplierRequest,
} from "@/features/admin/contracts";

export type BackendApiError = import("@/lib/api/generated/types").BackendSchema["ApiError"];
export type AiApiError = import("@/lib/api/generated/types").AiSchema["ErrorDetail"];
