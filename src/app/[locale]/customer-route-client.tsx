"use client";

import dynamic from "next/dynamic";

import {
  AccountPageSkeleton,
  CartPageSkeleton,
  CheckoutPageSkeleton,
  OrderDetailPageSkeleton,
  OrdersPageSkeleton,
} from "@/components/ui/loading-skeletons";

const AccountPage = dynamic(
  () => import("@/features/account/account-page").then((module) => module.AccountPage),
  {loading: () => <AccountPageSkeleton />},
);
const CartPage = dynamic(
  () => import("@/features/cart/cart-page").then((module) => module.CartPage),
  {loading: () => <CartPageSkeleton />},
);
const CheckoutPage = dynamic(
  () => import("@/features/orders/checkout-page").then((module) => module.CheckoutPage),
  {loading: () => <CheckoutPageSkeleton />},
);
const OrdersPage = dynamic(
  () => import("@/features/orders/orders-page").then((module) => module.OrdersPage),
  {loading: () => <OrdersPageSkeleton />},
);
const OrderDetailPage = dynamic(
  () => import("@/features/orders/order-detail-page").then((module) => module.OrderDetailPage),
  {loading: () => <OrderDetailPageSkeleton />},
);

export function AccountRouteClient() {
  return <AccountPage />;
}

export function CartRouteClient() {
  return <CartPage />;
}

export function CheckoutRouteClient() {
  return <CheckoutPage />;
}

export function OrdersRouteClient() {
  return <OrdersPage />;
}

export function OrderDetailRouteClient({orderId}: {orderId: string}) {
  return <OrderDetailPage orderId={orderId} />;
}
