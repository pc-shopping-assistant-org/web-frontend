import { backendFetch } from "@/lib/api/client";
import type {
  AttributeDefinitionDto,
  CategoryAttributeDto,
  CategoryAttributeGroupDto,
  CategorySpecsDto,
  CustomerDetailDto,
  CustomerOrderSummaryDto,
  DashboardOverviewDto,
  DiscountDetailDto,
  EmployeeDetailDto,
  FileResponseDto,
  OptionDto,
  OrderStatusStatDto,
  PaymentDetailDto,
  RoleDto,
  SupplierDto,
} from "@/features/admin/contracts/dto";
import type {
  AdminProductFilter,
  CustomerFilter,
  DiscountFilter,
  EmployeeFilter,
  InvoiceFilter,
  OrderFilter,
  PaymentFilter,
  ReviewFilter,
  SupplierFilter,
} from "@/features/admin/contracts/filters";
import {
  mapAttributeDefinition,
  mapCategoryAttribute,
  mapCategoryAttributeGroup,
  mapCategorySpecs,
  mapCustomerDetail,
  mapCustomerOrderSummary,
  mapDashboardOverview,
  mapDiscountDetail,
  mapEmployeeDetail,
  mapFileResponse,
  mapOption,
  mapOrderStatusStat,
  mapPaymentDetail,
  mapRole,
  mapRevenueChartData,
  mapSupplier,
  mapTopSellingProduct,
  mapCustomersPage,
  mapDiscountsPage,
  mapEmployeesPage,
  mapPaymentsPage,
  mapSuppliersPage,
} from "@/features/admin/mappers";
import type {
  CustomersPageDto,
  DiscountsPageDto,
  EmployeesPageDto,
  PaymentsPageDto,
  RevenueChartDataDto,
  TopSellingProductDto,
  SuppliersPageDto,
} from "@/features/admin/contracts/dto";
import type {CategoryDto, BrandDto} from "@/features/catalog/contracts/dto";
import {mapBrand, mapCategory} from "@/features/catalog/mappers";
import type {
  ProductDetailDto,
  ProductImageDto,
  ProductPageDto,
  ProductVariantDto,
  ReviewDto,
  ReviewsPageDto,
} from "@/features/catalog/contracts/dto";
import {
  mapProductDetail,
  mapProductImage,
  mapProductPage,
  mapProductVariant,
  mapReview,
  mapReviewsPage,
} from "@/features/catalog/mappers";
import type {
  InvoiceDto,
  InvoicesPageDto,
  OrderDto,
  OrdersPageDto,
  PaymentMethodDto,
} from "@/features/orders/contracts/dto";
import {
  mapInvoice,
  mapInvoicesPage,
  mapOrder,
  mapOrdersPage,
  mapPaymentMethod,
} from "@/features/orders/mappers";
import {
  analyticsDateRangeRequestSchema,
  assignAttributeRequestSchema,
  createAttributeDefinitionRequestSchema,
  createBrandRequestSchema,
  createCategoryGroupRequestSchema,
  createCategoryRequestSchema,
  createDiscountRequestSchema,
  createEmployeeRequestSchema,
  createOptionRequestSchema,
  createProductImageRequestSchema,
  createProductRequestSchema,
  createProductVariantRequestSchema,
  createSupplierRequestSchema,
  updateAccountStatusRequestSchema,
  updateAttributeDefinitionRequestSchema,
  updateBrandRequestSchema,
  updateCategoryGroupRequestSchema,
  updateCategoryRequestSchema,
  updateDiscountRequestSchema,
  updateDiscountStatusRequestSchema,
  updateEmployeeRequestSchema,
  updateOrderStatusRequestSchema,
  updateOptionRequestSchema,
  updatePaymentStatusRequestSchema,
  updateProductRequestSchema,
  updateProductVariantRequestSchema,
  updateResourceStatusRequestSchema,
  updateReviewStatusRequestSchema,
  updateSupplierRequestSchema,
} from "@/features/admin/contracts/requests";
import {parseRequest} from "@/lib/api/parse-request";
import type {
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
  UpdateAttributeDefinitionRequest,
  UpdateBrandRequest,
  UpdateCategoryGroupRequest,
  UpdateCategoryRequest,
  UpdateDiscountRequest,
  UpdateEmployeeRequest,
  UpdateOptionRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
  UpdateSupplierRequest,
} from "@/features/admin/contracts/requests";

function queryString(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return params.size ? `?${params.toString()}` : "";
}

export function getDashboardOverview() {
  return backendFetch<DashboardOverviewDto>("/admin/analytics/overview").then(
    mapDashboardOverview,
  );
}
export function getOrderStatusStats() {
  return backendFetch<OrderStatusStatDto[]>(
    "/admin/analytics/order-status-stats",
  ).then((stats) => stats.map(mapOrderStatusStat));
}
export function getRevenueChart(
  filter: AnalyticsDateRangeRequest = {},
) {
  const payload = parseRequest(analyticsDateRangeRequestSchema, filter);
  return backendFetch<RevenueChartDataDto>(
    `/admin/analytics/revenue-chart${queryString(payload)}`,
  ).then(mapRevenueChartData);
}
export function getTopSelling(limit = 5, fromDate?: string, toDate?: string) {
  return backendFetch<TopSellingProductDto[]>(
    `/admin/analytics/top-selling${queryString({ limit, fromDate, toDate })}`,
  ).then((items) => items.map(mapTopSellingProduct));
}
export function getAdminProducts(
  filter: AdminProductFilter = {},
) {
  return backendFetch<ProductPageDto>(`/admin/products${queryString(filter)}`).then(mapProductPage);
}
export function getCustomers(
  filter: CustomerFilter = {},
) {
  return backendFetch<CustomersPageDto>(
    `/admin/customers${queryString(filter)}`,
  ).then(mapCustomersPage);
}
export function getEmployees(
  filter: EmployeeFilter = {},
) {
  return backendFetch<EmployeesPageDto>(
    `/admin/employees${queryString(filter)}`,
  ).then(mapEmployeesPage);
}
export function getSuppliers(
  filter: SupplierFilter = {},
) {
  return backendFetch<SuppliersPageDto>(
    `/admin/suppliers${queryString(filter)}`,
  ).then(mapSuppliersPage);
}
export function getDiscounts(
  filter: DiscountFilter = {},
) {
  return backendFetch<DiscountsPageDto>(
    `/admin/discounts${queryString(filter)}`,
  ).then(mapDiscountsPage);
}
export function getAdminOrders(
  filter: OrderFilter = {},
) {
  return backendFetch<OrdersPageDto>(`/admin/orders${queryString(filter)}`).then(mapOrdersPage);
}
export function getAdminPayments(
  filter: PaymentFilter = {},
) {
  return backendFetch<PaymentsPageDto>(
    `/admin/payments${queryString(filter)}`,
  ).then(mapPaymentsPage);
}
export function getAdminReviews(
  filter: ReviewFilter = {},
) {
  return backendFetch<ReviewsPageDto>(`/admin/reviews${queryString(filter)}`).then(mapReviewsPage);
}
export function getAdminPaymentMethods() {
  return backendFetch<PaymentMethodDto[]>("/admin/payment-methods").then((methods) => methods.map(mapPaymentMethod));
}
export function getAdminCustomer(id: string) {
  return backendFetch<CustomerDetailDto>(
    `/admin/customers/${encodeURIComponent(id)}`,
  ).then(mapCustomerDetail);
}
export function getAdminCustomerOrders(id: string) {
  return backendFetch<CustomerOrderSummaryDto[]>(
    `/admin/customers/${encodeURIComponent(id)}/orders`,
  ).then((orders) => orders.map(mapCustomerOrderSummary));
}
export function getAdminEmployee(id: string) {
  return backendFetch<EmployeeDetailDto>(
    `/admin/employees/${encodeURIComponent(id)}`,
  ).then(mapEmployeeDetail);
}
export function getAdminDiscount(id: string) {
  return backendFetch<DiscountDetailDto>(
    `/admin/discounts/${encodeURIComponent(id)}`,
  ).then(mapDiscountDetail);
}
export function getAdminOrder(id: string) {
  return backendFetch<OrderDto>(
    `/admin/orders/${encodeURIComponent(id)}`,
  ).then(mapOrder);
}
export function getOrderInvoice(id: string) {
  return backendFetch<InvoiceDto>(
    `/admin/orders/${encodeURIComponent(id)}/invoice`,
  ).then(mapInvoice);
}
export function getInvoices(
  filter: InvoiceFilter = {},
) {
  return backendFetch<InvoicesPageDto>(`/admin/invoices${queryString(filter)}`).then(mapInvoicesPage);
}
export function getAdminSupplier(id: string) {
  return backendFetch<SupplierDto>(
    `/admin/suppliers/${encodeURIComponent(id)}`,
  ).then(mapSupplier);
}
export function getRoles() {
  return backendFetch<RoleDto[]>("/admin/roles").then((roles) => roles.map(mapRole));
}
export function getOptions(type?: string) {
  return backendFetch<OptionDto[]>(
    `/options${queryString({ type })}`,
  ).then((options) => options.map(mapOption));
}
export function getAttributes() {
  return backendFetch<AttributeDefinitionDto[]>(
    "/attributes",
  ).then((attributes) => attributes.map(mapAttributeDefinition));
}
export function getCategorySpecsSchema(categoryId: string) {
  return backendFetch<CategorySpecsDto>(
    `/categories/${encodeURIComponent(categoryId)}/specs-schema`,
  ).then(mapCategorySpecs);
}
export function getAdminProductById(id: string) {
  return backendFetch<ProductDetailDto>(
    `/admin/products/${encodeURIComponent(id)}`,
  ).then(mapProductDetail);
}
export function uploadAdminFile(file: globalThis.File) {
  const body = new FormData();
  body.append("file", file);
  return backendFetch<FileResponseDto>("/admin/files", {
    method: "POST",
    body,
  }).then(mapFileResponse);
}

export function updateOrderStatus(
  orderId: string,
  status: string,
  reason?: string,
) {
  const payload = parseRequest(updateOrderStatusRequestSchema, {status, reason});
  return backendFetch<OrderDto>(
    `/admin/orders/${encodeURIComponent(orderId)}/status`,
    { method: "PATCH", body: JSON.stringify(payload) },
  ).then(mapOrder);
}
export function updatePaymentStatus(
  paymentId: string,
  status: string,
  providerTransactionCode?: string,
  note?: string,
) {
  const payload = parseRequest(updatePaymentStatusRequestSchema, {
    status,
    providerTransactionCode,
    note,
  });
  return backendFetch<PaymentDetailDto>(
    `/admin/payments/${encodeURIComponent(paymentId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  ).then(mapPaymentDetail);
}
export function updateProductStatus(
  productId: string,
  status: string,
  reason?: string,
) {
  const payload = parseRequest(updateResourceStatusRequestSchema, {status, reason});
  return backendFetch<string>(
    `/admin/products/${encodeURIComponent(productId)}/status`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}
export function updateCustomerStatus(
  accountId: string,
  status: string,
  reason?: string,
) {
  const payload = parseRequest(updateAccountStatusRequestSchema, {status, reason});
  return backendFetch<string>(
    `/admin/customers/${encodeURIComponent(accountId)}/status`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}
export function updateEmployeeStatus(
  accountId: string,
  status: string,
  reason?: string,
) {
  const payload = parseRequest(updateAccountStatusRequestSchema, {status, reason});
  return backendFetch<string>(
    `/admin/employees/${encodeURIComponent(accountId)}/status`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}
export function updateDiscountStatus(
  id: string,
  status: string,
  reason?: string,
) {
  const payload = parseRequest(updateDiscountStatusRequestSchema, {status, reason});
  return backendFetch<string>(
    `/admin/discounts/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}
export function updateReviewStatus(
  id: string,
  status: string,
  reason?: string,
) {
  const payload = parseRequest(updateReviewStatusRequestSchema, {status, reason});
  return backendFetch<ReviewDto>(
    `/admin/reviews/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: JSON.stringify(payload) },
  ).then(mapReview);
}

export function updateProduct(
  id: string,
  request: UpdateProductRequest,
) {
  const payload = parseRequest(updateProductRequestSchema, request);
  return backendFetch<ProductDetailDto>(
    `/admin/products/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(payload) },
  ).then(mapProductDetail);
}
export function createVariant(
  productId: string,
  request: CreateProductVariantRequest,
) {
  const payload = parseRequest(createProductVariantRequestSchema, request);
  return backendFetch<ProductVariantDto>(
    `/admin/products/${encodeURIComponent(productId)}/variants`,
    { method: "POST", body: JSON.stringify(payload) },
  ).then(mapProductVariant);
}
export function updateVariant(
  id: string,
  request: UpdateProductVariantRequest,
) {
  const payload = parseRequest(updateProductVariantRequestSchema, request);
  return backendFetch<ProductVariantDto>(
    `/admin/variants/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(payload) },
  ).then(mapProductVariant);
}
export function deleteVariant(id: string) {
  return backendFetch<string>(`/admin/variants/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
export function addVariantImage(
  variantId: string,
  request: CreateProductImageRequest,
) {
  const payload = parseRequest(createProductImageRequestSchema, request);
  return backendFetch<ProductImageDto>(
    `/admin/variants/${encodeURIComponent(variantId)}/images`,
    { method: "POST", body: JSON.stringify(payload) },
  ).then(mapProductImage);
}
export function deleteVariantImage(imageId: string) {
  return backendFetch<string>(`/admin/images/${encodeURIComponent(imageId)}`, {
    method: "DELETE",
  });
}
export function createDiscount(
  request: CreateDiscountRequest,
) {
  const payload = parseRequest(createDiscountRequestSchema, request);
  return backendFetch<DiscountDetailDto>(
    "/admin/discounts",
    { method: "POST", body: JSON.stringify(payload) },
  ).then(mapDiscountDetail);
}
export function updateDiscount(
  id: string,
  request: UpdateDiscountRequest,
) {
  const payload = parseRequest(updateDiscountRequestSchema, request);
  return backendFetch<DiscountDetailDto>(
    `/admin/discounts/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(payload) },
  ).then(mapDiscountDetail);
}
export function deleteDiscount(id: string) {
  return backendFetch<string>(`/admin/discounts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
export function createEmployee(
  request: CreateEmployeeRequest,
) {
  const payload = parseRequest(createEmployeeRequestSchema, request);
  return backendFetch<EmployeeDetailDto>(
    "/admin/employees",
    { method: "POST", body: JSON.stringify(payload) },
  ).then(mapEmployeeDetail);
}
export function updateEmployee(
  id: string,
  request: UpdateEmployeeRequest,
) {
  const payload = parseRequest(updateEmployeeRequestSchema, request);
  return backendFetch<EmployeeDetailDto>(
    `/admin/employees/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(payload) },
  ).then(mapEmployeeDetail);
}
export function createSupplier(
  request: CreateSupplierRequest,
) {
  const payload = parseRequest(createSupplierRequestSchema, request);
  return backendFetch<SupplierDto>("/admin/suppliers", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapSupplier);
}
export function updateSupplier(
  id: string,
  request: UpdateSupplierRequest,
) {
  const payload = parseRequest(updateSupplierRequestSchema, request);
  return backendFetch<SupplierDto>(
    `/admin/suppliers/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(payload) },
  ).then(mapSupplier);
}
export function deleteSupplier(id: string) {
  return backendFetch<string>(`/admin/suppliers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function createOption(request: CreateOptionRequest) {
  const payload = parseRequest(createOptionRequestSchema, request);
  return backendFetch<OptionDto>("/admin/options", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapOption);
}
export function updateOption(
  id: string,
  request: UpdateOptionRequest,
) {
  const payload = parseRequest(updateOptionRequestSchema, request);
  return backendFetch<OptionDto>(
    `/admin/options/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(payload) },
  ).then(mapOption);
}
export function deleteOption(id: string) {
  return backendFetch<string>(`/admin/options/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
export function createAttribute(
  request: CreateAttributeDefinitionRequest,
) {
  const payload = parseRequest(createAttributeDefinitionRequestSchema, request);
  return backendFetch<AttributeDefinitionDto>(
    "/admin/attributes",
    { method: "POST", body: JSON.stringify(payload) },
  ).then(mapAttributeDefinition);
}
export function updateAttribute(
  id: string,
  request: UpdateAttributeDefinitionRequest,
) {
  const payload = parseRequest(updateAttributeDefinitionRequestSchema, request);
  return backendFetch<AttributeDefinitionDto>(
    `/admin/attributes/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(payload) },
  ).then(mapAttributeDefinition);
}
export function deleteAttribute(id: string) {
  return backendFetch<string>(`/admin/attributes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function createCategoryAttributeGroup(
  request: CreateCategoryGroupRequest,
) {
  const payload = parseRequest(createCategoryGroupRequestSchema, request);
  return backendFetch<CategoryAttributeGroupDto>(
    "/admin/category-attributes/groups",
    { method: "POST", body: JSON.stringify(payload) },
  ).then(mapCategoryAttributeGroup);
}
export function updateCategoryAttributeGroup(
  groupId: string,
  request: UpdateCategoryGroupRequest,
) {
  const payload = parseRequest(updateCategoryGroupRequestSchema, request);
  return backendFetch<CategoryAttributeGroupDto>(
    `/admin/category-attributes/groups/${encodeURIComponent(groupId)}`,
    { method: "PUT", body: JSON.stringify(payload) },
  ).then(mapCategoryAttributeGroup);
}
export function assignCategoryAttribute(
  request: AssignAttributeRequest,
) {
  const payload = parseRequest(assignAttributeRequestSchema, request);
  return backendFetch<CategoryAttributeDto>(
    "/admin/category-attributes/assign",
    { method: "POST", body: JSON.stringify(payload) },
  ).then(mapCategoryAttribute);
}
export function deleteCategoryAttributeAssignment(id: string) {
  return backendFetch<string>(
    `/admin/category-attributes/assign/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function createCategory(
  request: CreateCategoryRequest,
) {
  const payload = parseRequest(createCategoryRequestSchema, request);
  return backendFetch<CategoryDto>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapCategory);
}
export function updateCategory(
  id: string,
  request: UpdateCategoryRequest,
) {
  const payload = parseRequest(updateCategoryRequestSchema, request);
  return backendFetch<CategoryDto>(
    `/admin/categories/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(payload) },
  ).then(mapCategory);
}
export function deleteCategory(id: string) {
  return backendFetch<string>(`/admin/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
export function createBrand(request: CreateBrandRequest) {
  const payload = parseRequest(createBrandRequestSchema, request);
  return backendFetch<BrandDto>("/admin/brands", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapBrand);
}
export function updateBrand(
  id: string,
  request: UpdateBrandRequest,
) {
  const payload = parseRequest(updateBrandRequestSchema, request);
  return backendFetch<BrandDto>(
    `/admin/brands/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(payload) },
  ).then(mapBrand);
}
export function deleteBrand(id: string) {
  return backendFetch<string>(`/admin/brands/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
export function createProduct(request: CreateProductRequest) {
  const payload = parseRequest(createProductRequestSchema, request);
  return backendFetch<ProductDetailDto>(
    "/admin/products",
    { method: "POST", body: JSON.stringify(payload) },
  ).then(mapProductDetail);
}
export function deleteProduct(id: string) {
  return backendFetch<string>(`/admin/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
