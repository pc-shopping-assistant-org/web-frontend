import {enumValues} from "@/lib/domain/enum-values";

export enum OrderStatus {
  PendingPayment = "PENDING_PAYMENT",
  PendingConfirmation = "PENDING_CONFIRMATION",
  Confirmed = "CONFIRMED",
  Shipping = "SHIPPING",
  Completed = "COMPLETED",
  Cancelled = "CANCELLED",
}

export enum OrderItemStatus {
  Active = "ACTIVE",
  Cancelled = "CANCELLED",
}

export enum PaymentStatus {
  Pending = "PENDING",
  Paid = "PAID",
  Failed = "FAILED",
}

export enum PaymentMethodCode {
  Cod = "COD",
  StripeCard = "STRIPE_CARD",
  BankTransfer = "BANK_TRANSFER",
}

export enum ShippingMethodCode {
  Standard = "STANDARD",
  Express = "EXPRESS",
  SameDay = "SAME_DAY",
}

export enum DiscountStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
  Expired = "EXPIRED",
  Disabled = "DISABLED",
  Deleted = "DELETED",
}

export enum DiscountType {
  Percent = "PERCENT",
  Fixed = "FIXED",
}

export enum DiscountScope {
  Order = "ORDER",
  AllItems = "ALL_ITEMS",
  Category = "CATEGORY",
  Variant = "VARIANT",
}

export type EditableDiscountStatus =
  | DiscountStatus.Active
  | DiscountStatus.Inactive
  | DiscountStatus.Expired
  | DiscountStatus.Disabled;

export const ORDER_STATUS_VALUES = enumValues(OrderStatus);
export const PAYMENT_STATUS_VALUES = enumValues(PaymentStatus);
export const PAYMENT_METHOD_CODE_VALUES = enumValues(PaymentMethodCode);
export const SHIPPING_METHOD_CODE_VALUES = enumValues(ShippingMethodCode);
export const DISCOUNT_STATUS_VALUES = enumValues(DiscountStatus);
export const EDITABLE_DISCOUNT_STATUS_VALUES = [
  DiscountStatus.Active,
  DiscountStatus.Inactive,
  DiscountStatus.Expired,
  DiscountStatus.Disabled,
] as const;
export const DISCOUNT_TYPE_VALUES = enumValues(DiscountType);
export const DISCOUNT_SCOPE_VALUES = enumValues(DiscountScope);

/** Legal order transitions used by admin controls and order detail. */
export const ORDER_STATUS_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  [OrderStatus.PendingPayment]: [
    OrderStatus.PendingPayment,
    OrderStatus.PendingConfirmation,
    OrderStatus.Cancelled,
  ],
  [OrderStatus.PendingConfirmation]: [
    OrderStatus.PendingConfirmation,
    OrderStatus.Confirmed,
    OrderStatus.Cancelled,
  ],
  [OrderStatus.Confirmed]: [
    OrderStatus.Confirmed,
    OrderStatus.Shipping,
    OrderStatus.Cancelled,
  ],
  [OrderStatus.Shipping]: [OrderStatus.Shipping, OrderStatus.Completed, OrderStatus.Cancelled],
  [OrderStatus.Completed]: [OrderStatus.Completed],
  [OrderStatus.Cancelled]: [OrderStatus.Cancelled],
};
