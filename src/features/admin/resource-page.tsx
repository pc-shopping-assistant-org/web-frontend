"use client";

import { useTranslations } from "next-intl";

import { ProductCreateForm } from "./catalog-management";
import { DiscountCreateForm } from "./discount-create";
import { DiscountListPage } from "./discount-list";
import { PageHeader } from "./list-kit";
import { OrderListPage } from "./order-list";
import { PaymentListPage } from "./payment-list";
import { PaymentMethodListPage } from "./payment-method-list";
import { ProductListPage } from "./product-list";
import { ReviewListPage } from "./review-list";
import { SupplierListPage } from "./supplier-list";

export type AdminResource =
  | "products"
  | "product-create"
  | "discount-create"
  | "orders"
  | "discounts"
  | "suppliers"
  | "payments"
  | "payment-methods"
  | "reviews";

export function AdminResourcePage({ resource }: { resource: AdminResource }) {
  switch (resource) {
    case "products":
      return <ProductListPage />;
    case "product-create":
      return <ProductCreate />;
    case "discount-create":
      return <DiscountCreate />;
    case "orders":
      return <OrderListPage />;
    case "discounts":
      return <DiscountListPage />;
    case "suppliers":
      return <SupplierListPage />;
    case "payments":
      return <PaymentListPage />;
    case "payment-methods":
      return <PaymentMethodListPage />;
    case "reviews":
      return <ReviewListPage />;
  }
}

function ProductCreate() {
  const t = useTranslations("admin");
  return (
    <div className="space-y-5">
      <PageHeader title={t("createProduct")} description={t("productCreateDescription")} />
      <ProductCreateForm />
    </div>
  );
}

function DiscountCreate() {
  const t = useTranslations("admin");
  const td = useTranslations("admin.discountCreate");
  return (
    <div className="space-y-5">
      <PageHeader title={t("createDiscount")} description={td("pageDescription")} />
      <DiscountCreateForm />
    </div>
  );
}
