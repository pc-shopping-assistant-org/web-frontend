"use client";

import dynamic from "next/dynamic";

import {AdminPageSkeleton} from "@/components/ui/loading-skeletons";
import type {AdminResource} from "@/features/admin/resource-page";

const AdminDashboardPage = dynamic(
  () => import("@/features/admin/dashboard-page").then((module) => module.AdminDashboardPage),
  {loading: () => <AdminPageSkeleton />},
);
const AdminResourcePage = dynamic(
  () => import("@/features/admin/resource-page").then((module) => module.AdminResourcePage),
  {loading: () => <AdminPageSkeleton />},
);
const CatalogSettingsPage = dynamic(
  () => import("@/features/admin/catalog-settings").then((module) => module.CatalogSettingsPage),
  {loading: () => <AdminPageSkeleton />},
);
const CategoryManagement = dynamic(
  () => import("@/features/admin/catalog-management").then((module) => module.CategoryManagement),
  {loading: () => <AdminPageSkeleton />},
);
const BrandManagement = dynamic(
  () => import("@/features/admin/catalog-management").then((module) => module.BrandManagement),
  {loading: () => <AdminPageSkeleton />},
);
const AdminProductDetailPage = dynamic(
  () => import("@/features/admin/detail-pages").then((module) => module.AdminProductDetailPage),
  {loading: () => <AdminPageSkeleton />},
);
const AdminCustomerDetailPage = dynamic(
  () => import("@/features/admin/detail-pages").then((module) => module.AdminCustomerDetailPage),
  {loading: () => <AdminPageSkeleton />},
);
const AdminEmployeeDetailPage = dynamic(
  () => import("@/features/admin/detail-pages").then((module) => module.AdminEmployeeDetailPage),
  {loading: () => <AdminPageSkeleton />},
);
const AdminDiscountDetailPage = dynamic(
  () => import("@/features/admin/detail-pages").then((module) => module.AdminDiscountDetailPage),
  {loading: () => <AdminPageSkeleton />},
);
const AdminOrderDetailPage = dynamic(
  () => import("@/features/admin/detail-pages").then((module) => module.AdminOrderDetailPage),
  {loading: () => <AdminPageSkeleton />},
);
const AdminSupplierDetailPage = dynamic(
  () => import("@/features/admin/detail-pages").then((module) => module.AdminSupplierDetailPage),
  {loading: () => <AdminPageSkeleton />},
);
const AdminInvoicesPage = dynamic(
  () => import("@/features/admin/detail-pages").then((module) => module.AdminInvoicesPage),
  {loading: () => <AdminPageSkeleton />},
);

export function AdminDashboardRouteClient({mode}: {mode?: "dashboard" | "statistics"}) {
  return <AdminDashboardPage mode={mode} />;
}

export function AdminResourceRouteClient({resource}: {resource: AdminResource}) {
  return <AdminResourcePage resource={resource} />;
}

export function CatalogSettingsRouteClient() {
  return <CatalogSettingsPage />;
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

export function AdminCustomerDetailRouteClient({customerId}: {customerId: string}) {
  return <AdminCustomerDetailPage customerId={customerId} />;
}

export function AdminEmployeeDetailRouteClient({employeeId}: {employeeId: string}) {
  return <AdminEmployeeDetailPage employeeId={employeeId} />;
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

export function AdminInvoicesRouteClient() {
  return <AdminInvoicesPage />;
}
