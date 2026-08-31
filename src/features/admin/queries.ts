"use client";

import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {createBrand, createCategory, createDiscount, createEmployee, createProduct, createSupplier, createVariant, deleteBrand, deleteCategory, deleteDiscount, deleteProduct, deleteSupplier, deleteVariant, getAdminCustomer, getAdminCustomerOrders, getAdminDiscount, getAdminEmployee, getAdminOrder, getAdminPaymentMethods, getAdminPayments, getAdminProducts, getAdminReviews, getAdminSupplier, getAdminOrders, getCustomers, getDashboardOverview, getDiscounts, getEmployees, getInvoices, getOptions, getOrderInvoice, getOrderStatusStats, getProductById, getRevenueChart, getRoles, getSuppliers, getTopSelling, updateBrand, updateCategory, updateDiscount, updateEmployee, updateProduct, updateSupplier, updateVariant, updateCustomerStatus, updateDiscountStatus, updateEmployeeStatus, updateOrderStatus, updatePaymentStatus, updateProductStatus, updateReviewStatus} from "./api";

export const adminKeys = {all: ["admin"] as const, dashboard: ["admin", "dashboard"] as const};
export function useDashboardOverview() { return useQuery({queryKey: adminKeys.dashboard, queryFn: getDashboardOverview, retry: false}); }
export function useOrderStatusStats() { return useQuery({queryKey: ["admin", "order-status"], queryFn: getOrderStatusStats, retry: false}); }
export function useRevenueChart(filter: Parameters<typeof getRevenueChart>[0] = {}) { return useQuery({queryKey: ["admin", "revenue-chart", filter], queryFn: () => getRevenueChart(filter), retry: false}); }
export function useTopSelling(limit = 5, fromDate?: string, toDate?: string) { return useQuery({queryKey: ["admin", "top-selling", limit, fromDate, toDate], queryFn: () => getTopSelling(limit, fromDate, toDate), retry: false}); }
export function useAdminProducts(filter: Parameters<typeof getAdminProducts>[0] = {}) { return useQuery({queryKey: ["admin", "products", filter], queryFn: () => getAdminProducts(filter), retry: false}); }
export function useAdminCustomers(filter: Parameters<typeof getCustomers>[0] = {}) { return useQuery({queryKey: ["admin", "customers", filter], queryFn: () => getCustomers(filter), retry: false}); }
export function useAdminEmployees(filter: Parameters<typeof getEmployees>[0] = {}) { return useQuery({queryKey: ["admin", "employees", filter], queryFn: () => getEmployees(filter), retry: false}); }
export function useAdminSuppliers(filter: Parameters<typeof getSuppliers>[0] = {}) { return useQuery({queryKey: ["admin", "suppliers", filter], queryFn: () => getSuppliers(filter), retry: false}); }
export function useAdminDiscounts(filter: Parameters<typeof getDiscounts>[0] = {}) { return useQuery({queryKey: ["admin", "discounts", filter], queryFn: () => getDiscounts(filter), retry: false}); }
export function useAdminOrders(filter: Parameters<typeof getAdminOrders>[0] = {}) { return useQuery({queryKey: ["admin", "orders", filter], queryFn: () => getAdminOrders(filter), retry: false}); }
export function useAdminPayments(filter: Parameters<typeof getAdminPayments>[0] = {}) { return useQuery({queryKey: ["admin", "payments", filter], queryFn: () => getAdminPayments(filter), retry: false}); }
export function useAdminReviews(filter: Parameters<typeof getAdminReviews>[0] = {}) { return useQuery({queryKey: ["admin", "reviews", filter], queryFn: () => getAdminReviews(filter), retry: false}); }
export function useAdminPaymentMethods() { return useQuery({queryKey: ["admin", "payment-methods"], queryFn: getAdminPaymentMethods, retry: false}); }
export function useAdminCustomer(id: string) { return useQuery({queryKey: ["admin", "customer", id], queryFn: () => getAdminCustomer(id), enabled: Boolean(id), retry: false}); }
export function useAdminCustomerOrders(id: string) { return useQuery({queryKey: ["admin", "customer-orders", id], queryFn: () => getAdminCustomerOrders(id), enabled: Boolean(id), retry: false}); }
export function useAdminEmployee(id: string) { return useQuery({queryKey: ["admin", "employee", id], queryFn: () => getAdminEmployee(id), enabled: Boolean(id), retry: false}); }
export function useAdminDiscount(id: string) { return useQuery({queryKey: ["admin", "discount", id], queryFn: () => getAdminDiscount(id), enabled: Boolean(id), retry: false}); }
export function useAdminOrder(id: string) { return useQuery({queryKey: ["admin", "order", id], queryFn: () => getAdminOrder(id), enabled: Boolean(id), retry: false}); }
export function useOrderInvoice(id: string, enabled = true) { return useQuery({queryKey: ["admin", "order-invoice", id], queryFn: () => getOrderInvoice(id), enabled: Boolean(id) && enabled, retry: false}); }
export function useInvoices(filter: Parameters<typeof getInvoices>[0] = {}) { return useQuery({queryKey: ["admin", "invoices", filter], queryFn: () => getInvoices(filter), retry: false}); }
export function useAdminSupplier(id: string) { return useQuery({queryKey: ["admin", "supplier", id], queryFn: () => getAdminSupplier(id), enabled: Boolean(id), retry: false}); }
export function useRoles() { return useQuery({queryKey: ["admin", "roles"], queryFn: getRoles, staleTime: 300_000, retry: false}); }
export function useAdminProduct(id: string) { return useQuery({queryKey: ["admin", "product", id], queryFn: () => getProductById(id), enabled: Boolean(id), retry: false}); }
export function useOptions(type?: string) { return useQuery({queryKey: ["admin", "options", type], queryFn: () => getOptions(type), staleTime: 300_000, retry: false}); }

function useStatusMutation<TVariables, TData>(mutationFn: (variables: TVariables) => Promise<TData>) { const qc = useQueryClient(); return useMutation<TData, Error, TVariables>({mutationFn, onSuccess: () => qc.invalidateQueries({queryKey: adminKeys.all})}); }
export function useAdminOrderStatus() { return useStatusMutation(({id, status, reason}: {id: string; status: string; reason?: string}) => updateOrderStatus(id, status, reason)); }
export function useAdminPaymentStatus() { return useStatusMutation(({id, status, providerTransactionCode, note}: {id: string; status: string; providerTransactionCode?: string; note?: string}) => updatePaymentStatus(id, status, providerTransactionCode, note)); }
export function useAdminProductStatus() { return useStatusMutation(({id, status, reason}: {id: string; status: string; reason?: string}) => updateProductStatus(id, status, reason)); }
export function useAdminCustomerStatus() { return useStatusMutation(({id, status, reason}: {id: string; status: string; reason?: string}) => updateCustomerStatus(id, status, reason)); }
export function useAdminEmployeeStatus() { return useStatusMutation(({id, status, reason}: {id: string; status: string; reason?: string}) => updateEmployeeStatus(id, status, reason)); }
export function useAdminDiscountStatus() { return useStatusMutation(({id, status, reason}: {id: string; status: string; reason?: string}) => updateDiscountStatus(id, status, reason)); }
export function useAdminReviewStatus() { return useStatusMutation(({id, status, reason}: {id: string; status: string; reason?: string}) => updateReviewStatus(id, status, reason)); }
function useAdminMutation<TVariables, TData>(mutationFn: (variables: TVariables) => Promise<TData>) { const qc = useQueryClient(); return useMutation<TData, Error, TVariables>({mutationFn, onSuccess: () => qc.invalidateQueries({queryKey: adminKeys.all})}); }
export function useCreateAdminCategory() { return useAdminMutation(createCategory); }
export function useUpdateAdminCategory() { return useAdminMutation(({id, request}: {id: string; request: Parameters<typeof updateCategory>[1]}) => updateCategory(id, request)); }
export function useDeleteAdminCategory() { return useAdminMutation(deleteCategory); }
export function useCreateAdminBrand() { return useAdminMutation(createBrand); }
export function useUpdateAdminBrand() { return useAdminMutation(({id, request}: {id: string; request: Parameters<typeof updateBrand>[1]}) => updateBrand(id, request)); }
export function useDeleteAdminBrand() { return useAdminMutation(deleteBrand); }
export function useCreateAdminProduct() { return useAdminMutation(createProduct); }
export function useDeleteAdminProduct() { return useAdminMutation(deleteProduct); }
export function useUpdateAdminProduct() { return useAdminMutation(({id, request}: {id: string; request: Parameters<typeof updateProduct>[1]}) => updateProduct(id, request)); }
export function useCreateAdminVariant() { return useAdminMutation(({productId, request}: {productId: string; request: Parameters<typeof createVariant>[1]}) => createVariant(productId, request)); }
export function useUpdateAdminVariant() { return useAdminMutation(({id, request}: {id: string; request: Parameters<typeof updateVariant>[1]}) => updateVariant(id, request)); }
export function useDeleteAdminVariant() { return useAdminMutation(deleteVariant); }
export function useCreateAdminDiscount() { return useAdminMutation(createDiscount); }
export function useUpdateAdminDiscount() { return useAdminMutation(({id, request}: {id: string; request: Parameters<typeof updateDiscount>[1]}) => updateDiscount(id, request)); }
export function useDeleteAdminDiscount() { return useAdminMutation(deleteDiscount); }
export function useCreateAdminEmployee() { return useAdminMutation(createEmployee); }
export function useUpdateAdminEmployee() { return useAdminMutation(({id, request}: {id: string; request: Parameters<typeof updateEmployee>[1]}) => updateEmployee(id, request)); }
export function useCreateAdminSupplier() { return useAdminMutation(createSupplier); }
export function useUpdateAdminSupplier() { return useAdminMutation(({id, request}: {id: string; request: Parameters<typeof updateSupplier>[1]}) => updateSupplier(id, request)); }
export function useDeleteAdminSupplier() { return useAdminMutation(deleteSupplier); }
