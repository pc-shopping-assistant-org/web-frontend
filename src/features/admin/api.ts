import {backendFetch} from "@/lib/api/client";
import type {BackendSchema, CustomersPage, DashboardOverview, DiscountsPage, EmployeesPage, InvoicesPage, OrdersPage, PaymentsPage, ProductPage, ReviewsPage, SuppliersPage, OrderStatusStat, PaymentMethod, ProductDetail} from "@/lib/api/types";

function queryString(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== "") params.set(key, String(value));
  return params.size ? `?${params.toString()}` : "";
}

export function getDashboardOverview() { return backendFetch<DashboardOverview>("/admin/analytics/overview"); }
export function getOrderStatusStats() { return backendFetch<OrderStatusStat[]>("/admin/analytics/order-status-stats"); }
export function getRevenueChart(filter: BackendSchema["AnalyticsDateRangeRequest"] = {}) { return backendFetch<BackendSchema["RevenueChartDataResponse"]>(`/admin/analytics/revenue-chart${queryString(filter)}`); }
export function getTopSelling(limit = 5, fromDate?: string, toDate?: string) { return backendFetch<BackendSchema["TopSellingProductResponse"][]>(`/admin/analytics/top-selling${queryString({limit, fromDate, toDate})}`); }
export function getAdminProducts(filter: BackendSchema["ProductFilterRequest"] = {}) { return backendFetch<ProductPage>(`/admin/products${queryString(filter)}`); }
export function getCustomers(filter: BackendSchema["CustomerFilterRequest"] = {}) { return backendFetch<CustomersPage>(`/admin/customers${queryString(filter)}`); }
export function getEmployees(filter: BackendSchema["EmployeeFilterRequest"] = {}) { return backendFetch<EmployeesPage>(`/admin/employees${queryString(filter)}`); }
export function getSuppliers(filter: BackendSchema["SupplierFilterRequest"] = {}) { return backendFetch<SuppliersPage>(`/admin/suppliers${queryString(filter)}`); }
export function getDiscounts(filter: BackendSchema["DiscountFilterRequest"] = {}) { return backendFetch<DiscountsPage>(`/admin/discounts${queryString(filter)}`); }
export function getAdminOrders(filter: BackendSchema["OrderFilterRequest"] = {}) { return backendFetch<OrdersPage>(`/admin/orders${queryString(filter)}`); }
export function getAdminPayments(filter: BackendSchema["PaymentFilterRequest"] = {}) { return backendFetch<PaymentsPage>(`/admin/payments${queryString(filter)}`); }
export function getAdminReviews(filter: BackendSchema["ReviewFilterRequest"] = {}) { return backendFetch<ReviewsPage>(`/admin/reviews${queryString(filter)}`); }
export function getAdminPaymentMethods() { return backendFetch<PaymentMethod[]>("/admin/payment-methods"); }
export function getAdminCustomer(id: string) { return backendFetch<BackendSchema["CustomerDetailResponse"]>(`/admin/customers/${encodeURIComponent(id)}`); }
export function getAdminCustomerOrders(id: string) { return backendFetch<BackendSchema["CustomerOrderSummaryResponse"][]>(`/admin/customers/${encodeURIComponent(id)}/orders`); }
export function getAdminEmployee(id: string) { return backendFetch<BackendSchema["EmployeeDetailResponse"]>(`/admin/employees/${encodeURIComponent(id)}`); }
export function getAdminDiscount(id: string) { return backendFetch<BackendSchema["DiscountDetailResponse"]>(`/admin/discounts/${encodeURIComponent(id)}`); }
export function getAdminOrder(id: string) { return backendFetch<BackendSchema["OrderDetailResponse"]>(`/admin/orders/${encodeURIComponent(id)}`); }
export function getOrderInvoice(id: string) { return backendFetch<BackendSchema["InvoiceResponse"]>(`/admin/orders/${encodeURIComponent(id)}/invoice`); }
export function getInvoices(filter: BackendSchema["InvoiceFilterRequest"] = {}) { return backendFetch<InvoicesPage>(`/admin/invoices${queryString(filter)}`); }
export function getAdminSupplier(id: string) { return backendFetch<BackendSchema["SupplierResponse"]>(`/admin/suppliers/${encodeURIComponent(id)}`); }
export function getRoles() { return backendFetch<BackendSchema["RoleResponse"][]>("/admin/roles"); }
export function getOptions(type?: string) { return backendFetch<BackendSchema["OptionResponse"][]>(`/options${queryString({type})}`); }
export function getProductById(id: string) { return backendFetch<ProductDetail>(`/products/${encodeURIComponent(id)}`); }

export function updateOrderStatus(orderId: string, status: string, reason?: string) { return backendFetch<BackendSchema["OrderDetailResponse"]>(`/admin/orders/${encodeURIComponent(orderId)}/status`, {method: "PATCH", body: JSON.stringify({status, reason})}); }
export function updatePaymentStatus(paymentId: string, status: string, providerTransactionCode?: string, note?: string) { return backendFetch<BackendSchema["PaymentDetailResponse"]>(`/admin/payments/${encodeURIComponent(paymentId)}/status`, {method: "PATCH", body: JSON.stringify({status, providerTransactionCode, note})}); }
export function updateProductStatus(productId: string, status: string, reason?: string) { return backendFetch<string>(`/admin/products/${encodeURIComponent(productId)}/status`, {method: "PATCH", body: JSON.stringify({status, reason})}); }
export function updateCustomerStatus(accountId: string, status: string, reason?: string) { return backendFetch<string>(`/admin/customers/${encodeURIComponent(accountId)}/status`, {method: "PATCH", body: JSON.stringify({status, reason})}); }
export function updateEmployeeStatus(accountId: string, status: string, reason?: string) { return backendFetch<string>(`/admin/employees/${encodeURIComponent(accountId)}/status`, {method: "PATCH", body: JSON.stringify({status, reason})}); }
export function updateDiscountStatus(id: string, status: string, reason?: string) { return backendFetch<string>(`/admin/discounts/${encodeURIComponent(id)}/status`, {method: "PATCH", body: JSON.stringify({status, reason})}); }
export function updateReviewStatus(id: string, status: string, reason?: string) { return backendFetch<BackendSchema["ReviewResponse"]>(`/admin/reviews/${encodeURIComponent(id)}/status`, {method: "PATCH", body: JSON.stringify({status, reason})}); }

export function updateProduct(id: string, request: BackendSchema["UpdateProductRequest"]) { return backendFetch<BackendSchema["ProductDetailResponse"]>(`/admin/products/${encodeURIComponent(id)}`, {method: "PUT", body: JSON.stringify(request)}); }
export function createVariant(productId: string, request: BackendSchema["CreateProductVariantRequest"]) { return backendFetch<BackendSchema["ProductVariantResponse"]>(`/admin/products/${encodeURIComponent(productId)}/variants`, {method: "POST", body: JSON.stringify(request)}); }
export function updateVariant(id: string, request: BackendSchema["UpdateProductVariantRequest"]) { return backendFetch<BackendSchema["ProductVariantResponse"]>(`/admin/variants/${encodeURIComponent(id)}`, {method: "PUT", body: JSON.stringify(request)}); }
export function deleteVariant(id: string) { return backendFetch<string>(`/admin/variants/${encodeURIComponent(id)}`, {method: "DELETE"}); }
export function createDiscount(request: BackendSchema["CreateDiscountRequest"]) { return backendFetch<BackendSchema["DiscountDetailResponse"]>("/admin/discounts", {method: "POST", body: JSON.stringify(request)}); }
export function updateDiscount(id: string, request: BackendSchema["UpdateDiscountRequest"]) { return backendFetch<BackendSchema["DiscountDetailResponse"]>(`/admin/discounts/${encodeURIComponent(id)}`, {method: "PUT", body: JSON.stringify(request)}); }
export function deleteDiscount(id: string) { return backendFetch<string>(`/admin/discounts/${encodeURIComponent(id)}`, {method: "DELETE"}); }
export function createEmployee(request: BackendSchema["CreateEmployeeRequest"]) { return backendFetch<BackendSchema["EmployeeDetailResponse"]>("/admin/employees", {method: "POST", body: JSON.stringify(request)}); }
export function updateEmployee(id: string, request: BackendSchema["UpdateEmployeeRequest"]) { return backendFetch<BackendSchema["EmployeeDetailResponse"]>(`/admin/employees/${encodeURIComponent(id)}`, {method: "PUT", body: JSON.stringify(request)}); }
export function createSupplier(request: BackendSchema["CreateSupplierRequest"]) { return backendFetch<BackendSchema["SupplierResponse"]>("/admin/suppliers", {method: "POST", body: JSON.stringify(request)}); }
export function updateSupplier(id: string, request: BackendSchema["UpdateSupplierRequest"]) { return backendFetch<BackendSchema["SupplierResponse"]>(`/admin/suppliers/${encodeURIComponent(id)}`, {method: "PUT", body: JSON.stringify(request)}); }
export function deleteSupplier(id: string) { return backendFetch<string>(`/admin/suppliers/${encodeURIComponent(id)}`, {method: "DELETE"}); }

export function createCategory(request: BackendSchema["CreateCategoryRequest"]) { return backendFetch<BackendSchema["CategoryResponse"]>("/admin/categories", {method: "POST", body: JSON.stringify(request)}); }
export function updateCategory(id: string, request: BackendSchema["UpdateCategoryRequest"]) { return backendFetch<BackendSchema["CategoryResponse"]>(`/admin/categories/${encodeURIComponent(id)}`, {method: "PUT", body: JSON.stringify(request)}); }
export function deleteCategory(id: string) { return backendFetch<string>(`/admin/categories/${encodeURIComponent(id)}`, {method: "DELETE"}); }
export function createBrand(request: BackendSchema["CreateBrandRequest"]) { return backendFetch<BackendSchema["BrandResponse"]>("/admin/brands", {method: "POST", body: JSON.stringify(request)}); }
export function updateBrand(id: string, request: BackendSchema["UpdateBrandRequest"]) { return backendFetch<BackendSchema["BrandResponse"]>(`/admin/brands/${encodeURIComponent(id)}`, {method: "PUT", body: JSON.stringify(request)}); }
export function deleteBrand(id: string) { return backendFetch<string>(`/admin/brands/${encodeURIComponent(id)}`, {method: "DELETE"}); }
export function createProduct(request: BackendSchema["CreateProductRequest"]) { return backendFetch<BackendSchema["ProductDetailResponse"]>("/admin/products", {method: "POST", body: JSON.stringify(request)}); }
export function deleteProduct(id: string) { return backendFetch<string>(`/admin/products/${encodeURIComponent(id)}`, {method: "DELETE"}); }
