import { backendFetch } from "@/lib/api/client";
import type {
  AttributeDefinitionDto,
  CategoryAttributeDto,
  CategoryAttributeGroupDto,
  CategorySpecsDto,
  CustomerDetailDto,
  CustomerOrderSummaryDto,
  DashboardOverviewDto,
  DiscountDto,
  EmployeeDetailDto,
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
import {buildCategoryTree, mapBrandResponse, mapCategoryResponse} from "@/features/catalog/mappers";
import type {
  ProductDetailDto,
  ProductPageDto,
  ProductVariantDto,
  ReviewDto,
  ReviewsPageDto,
} from "@/features/catalog/contracts/dto";
import {
  mapProductDetail,
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

const CATALOG = "/catalog-service";
const PROMOTION = "/promotion-service";

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
  return backendFetch<ProductPageDto>(`/catalog-service/products/admin${queryString(filter)}`).then(mapProductPage);
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
    `${PROMOTION}/discounts${queryString(filter)}`,
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
  return backendFetch<DiscountDto>(
    `${PROMOTION}/discounts/${encodeURIComponent(id)}`,
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
    `/catalog-service/categories/${encodeURIComponent(categoryId)}/attributes`,
  ).then(mapCategorySpecs);
}
export function getAdminProductById(id: string) {
  return backendFetch<ProductDetailDto>(
    `/catalog-service/products/admin/${encodeURIComponent(id)}`,
  ).then(mapProductDetail);
}
/** The file shape media-service returns; the admin model keeps its older field names. */
type MediaFileDto = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt?: string;
};

export function uploadAdminFile(file: globalThis.File) {
  const body = new FormData();
  body.append("file", file);
  return backendFetch<MediaFileDto>("/media-service/files", {
    method: "POST",
    body,
  }).then((dto) => ({
    id: dto.id,
    originalName: dto.originalName,
    mimeType: dto.mimeType,
    sizeBytes: dto.sizeBytes,
    publicUrl: dto.url,
    createdAt: dto.createdAt,
  }));
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
export function updateProductStatus(productId: string, status: string) {
  const payload = parseRequest(updateResourceStatusRequestSchema, {status});
  return backendFetch<ProductDetailDto>(
    `${CATALOG}/products/${encodeURIComponent(productId)}/status`,
    { method: "PATCH", body: JSON.stringify({status: payload.status}) },
  ).then(mapProductDetail);
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
export function updateDiscountStatus(id: string, status: string) {
  const payload = parseRequest(updateDiscountStatusRequestSchema, {status});
  return backendFetch<DiscountDto>(
    `${PROMOTION}/discounts/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: JSON.stringify({status: payload.status}) },
  ).then(mapDiscountDetail);
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
    `${CATALOG}/products/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(payload) },
  ).then(mapProductDetail);
}
export function createVariant(
  productId: string,
  request: CreateProductVariantRequest,
) {
  const payload = parseRequest(createProductVariantRequestSchema, request);
  return backendFetch<ProductVariantDto>(
    `${CATALOG}/products/${encodeURIComponent(productId)}/variants`,
    { method: "POST", body: JSON.stringify(payload) },
  ).then(mapProductVariant);
}
/** The details and the status are two backend calls; the status one only when it differs. */
export async function updateVariant(
  productId: string,
  id: string,
  request: UpdateProductVariantRequest,
) {
  const {status, ...details} = parseRequest(updateProductVariantRequestSchema, request);
  const path = `${CATALOG}/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(id)}`;
  let variant = await backendFetch<ProductVariantDto>(path, { method: "PUT", body: JSON.stringify(details) });
  if (status && status !== variant.status) {
    variant = await backendFetch<ProductVariantDto>(`${path}/status`, { method: "PATCH", body: JSON.stringify({status}) });
  }
  return mapProductVariant(variant);
}
export function deleteVariant({productId, id}: {productId: string; id: string}) {
  return backendFetch<null>(
    `${CATALOG}/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}
export function createDiscount(
  request: CreateDiscountRequest,
) {
  const payload = parseRequest(createDiscountRequestSchema, request);
  return backendFetch<DiscountDto>(`${PROMOTION}/discounts`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapDiscountDetail);
}
/** The definition and the status are two backend calls; the status one only when it differs. */
export async function updateDiscount(
  id: string,
  request: UpdateDiscountRequest,
) {
  const {status, ...definition} = parseRequest(updateDiscountRequestSchema, request);
  const path = `${PROMOTION}/discounts/${encodeURIComponent(id)}`;
  // The backend keeps the current code when it is omitted and removes it when it is blank, so a cleared code is sent as ""
  let discount = await backendFetch<DiscountDto>(path, { method: "PUT", body: JSON.stringify({ ...definition, code: definition.code ?? "" }) });
  if (status && status !== discount.status) {
    discount = await backendFetch<DiscountDto>(`${path}/status`, { method: "PATCH", body: JSON.stringify({status}) });
  }
  return mapDiscountDetail(discount);
}
export function deleteDiscount(id: string) {
  return backendFetch<null>(`${PROMOTION}/discounts/${encodeURIComponent(id)}`, {
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

/** Every category including inactive ones, as a tree. */
export async function getAdminCategories() {
  return buildCategoryTree(await backendFetch<CategoryDto[]>(`${CATALOG}/categories/admin`));
}
export function createCategory(
  request: CreateCategoryRequest,
) {
  const payload = parseRequest(createCategoryRequestSchema, request);
  return backendFetch<CategoryDto>(`${CATALOG}/categories`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapCategoryResponse);
}
export function updateCategory(
  id: string,
  request: UpdateCategoryRequest,
) {
  const payload = parseRequest(updateCategoryRequestSchema, request);
  return backendFetch<CategoryDto>(
    `${CATALOG}/categories/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  ).then(mapCategoryResponse);
}
export function deleteCategory(id: string) {
  return backendFetch<null>(`${CATALOG}/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/** Every brand including inactive ones. */
export async function getAdminBrands() {
  return (await backendFetch<BrandDto[]>(`${CATALOG}/brands/admin`)).map(mapBrandResponse);
}
export function createBrand(request: CreateBrandRequest) {
  const payload = parseRequest(createBrandRequestSchema, request);
  return backendFetch<BrandDto>(`${CATALOG}/brands`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapBrandResponse);
}
/** The details and the status are two backend calls; the status one only when it is asked for. */
export async function updateBrand(
  id: string,
  request: UpdateBrandRequest,
) {
  const {status, ...details} = parseRequest(updateBrandRequestSchema, request);
  const path = `${CATALOG}/brands/${encodeURIComponent(id)}`;
  let brand = await backendFetch<BrandDto>(path, { method: "PUT", body: JSON.stringify(details) });
  if (status && status !== brand.status) {
    brand = await backendFetch<BrandDto>(`${path}/status`, { method: "PATCH", body: JSON.stringify({status}) });
  }
  return mapBrandResponse(brand);
}
export function deleteBrand(id: string) {
  return backendFetch<null>(`${CATALOG}/brands/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
export function createProduct(request: CreateProductRequest) {
  const payload = parseRequest(createProductRequestSchema, request);
  return backendFetch<ProductDetailDto>(
    `${CATALOG}/products`,
    { method: "POST", body: JSON.stringify(payload) },
  ).then(mapProductDetail);
}
export function deleteProduct(id: string) {
  return backendFetch<null>(`${CATALOG}/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
