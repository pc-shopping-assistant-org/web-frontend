"use client";

import dynamic from "next/dynamic";

import {AdminPageSkeleton} from "@/components/ui/loading-skeletons";
import type {AdminResource} from "@/features/admin/resource-page";

const DashboardPage = dynamic(() => import("@/features/dashboard/dashboard-page").then((module) => module.DashboardPage), {
  loading: () => <AdminPageSkeleton />,
});
const StatisticsPage = dynamic(() => import("@/features/dashboard/statistics-page").then((module) => module.StatisticsPage), {
  loading: () => <AdminPageSkeleton />,
});
const AdminResourcePage = dynamic(() => import("@/features/admin/resource-page").then((module) => module.AdminResourcePage), {
  loading: () => <AdminPageSkeleton />,
});
const CatalogSettingsPage = dynamic(() => import("@/features/admin/catalog-settings").then((module) => module.CatalogSettingsPage), {
  loading: () => <AdminPageSkeleton />,
});
const SearchIndexPage = dynamic(() => import("@/features/admin/search-index-page").then((module) => module.SearchIndexPage), {
  loading: () => <AdminPageSkeleton />,
});
const CategoryManagement = dynamic(() => import("@/features/admin/category-management").then((module) => module.CategoryManagement), {
  loading: () => <AdminPageSkeleton />,
});
const BrandManagement = dynamic(() => import("@/features/admin/brand-management").then((module) => module.BrandManagement), {
  loading: () => <AdminPageSkeleton />,
});
const AdminProductDetailPage = dynamic(() => import("@/features/admin/product-detail").then((module) => module.AdminProductDetailPage), {
  loading: () => <AdminPageSkeleton />,
});
const CustomersPage = dynamic(() => import("@/features/customers/customers-page").then((module) => module.CustomersPage), {
  loading: () => <AdminPageSkeleton />,
});
const CustomerDetailPage = dynamic(() => import("@/features/customers/customer-detail-page").then((module) => module.CustomerDetailPage), {
  loading: () => <AdminPageSkeleton />,
});
const EmployeesPage = dynamic(() => import("@/features/employees/employees-page").then((module) => module.EmployeesPage), {
  loading: () => <AdminPageSkeleton />,
});
const EmployeeCreatePage = dynamic(() => import("@/features/employees/employee-create-page").then((module) => module.EmployeeCreatePage), {
  loading: () => <AdminPageSkeleton />,
});
const EmployeeDetailPage = dynamic(() => import("@/features/employees/employee-detail-page").then((module) => module.EmployeeDetailPage), {
  loading: () => <AdminPageSkeleton />,
});
const AdminDiscountDetailPage = dynamic(() => import("@/features/admin/discount-detail").then((module) => module.AdminDiscountDetailPage), {
  loading: () => <AdminPageSkeleton />,
});
const AdminOrderDetailPage = dynamic(() => import("@/features/admin/order-detail").then((module) => module.AdminOrderDetailPage), {
  loading: () => <AdminPageSkeleton />,
});
const AdminSupplierDetailPage = dynamic(() => import("@/features/admin/supplier-detail").then((module) => module.AdminSupplierDetailPage), {
  loading: () => <AdminPageSkeleton />,
});
const AdminInvoiceDetailPage = dynamic(() => import("@/features/admin/invoice-pages").then((module) => module.AdminInvoiceDetailPage), {
  loading: () => <AdminPageSkeleton />,
});
const AdminInvoicesPage = dynamic(() => import("@/features/admin/invoice-pages").then((module) => module.AdminInvoicesPage), {
  loading: () => <AdminPageSkeleton />,
});

export function AdminDashboardRouteClient({mode}: {mode?: "dashboard" | "statistics"}) {
  return mode === "statistics" ? <StatisticsPage /> : <DashboardPage />;
}

export function AdminResourceRouteClient({resource}: {resource: AdminResource}) {
  return <AdminResourcePage resource={resource} />;
}

export function CatalogSettingsRouteClient() {
  return <CatalogSettingsPage />;
}

export function SearchIndexRouteClient() {
  return <SearchIndexPage />;
}

export function CategoryManagementRouteClient() {
  return <CategoryManagement />;
}

export function BrandManagementRouteClient() {
  return <BrandManagement />;
}

export function AdminProductDetailRouteClient({productId}: {productId: string}) {
  return <AdminProductDetailPage productId={productId} />;
}

export function CustomersRouteClient() {
  return <CustomersPage />;
}

export function AdminCustomerDetailRouteClient({customerId}: {customerId: string}) {
  return <CustomerDetailPage customerId={customerId} />;
}

export function EmployeesRouteClient() {
  return <EmployeesPage />;
}

export function EmployeeCreateRouteClient() {
  return <EmployeeCreatePage />;
}

export function AdminEmployeeDetailRouteClient({employeeId}: {employeeId: string}) {
  return <EmployeeDetailPage employeeId={employeeId} />;
}

export function AdminDiscountDetailRouteClient({discountId}: {discountId: string}) {
  return <AdminDiscountDetailPage discountId={discountId} />;
}

export function AdminOrderDetailRouteClient({orderId}: {orderId: string}) {
  return <AdminOrderDetailPage orderId={orderId} />;
}

export function AdminSupplierDetailRouteClient({supplierId}: {supplierId: string}) {
  return <AdminSupplierDetailPage supplierId={supplierId} />;
}

export function AdminInvoiceDetailRouteClient({orderId}: {orderId: string}) {
  return <AdminInvoiceDetailPage orderId={orderId} />;
}

export function AdminInvoicesRouteClient() {
  return <AdminInvoicesPage />;
}
