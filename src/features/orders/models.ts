import type {OrderStatus, PaymentStatus} from "@/lib/domain/commerce-enums";

/** Frontend-owned commerce models used by checkout, order history and admin. */
export type PaymentSummary = {
  id: string;
  amount: number;
  paidAt?: string;
  paymentMethodCode?: string;
  providerTransactionCode?: string;
  status?: PaymentStatus | string;
};

export type OrderItem = {
  id: string;
  imageUrl?: string;
  itemDiscount: number;
  itemGross: number;
  itemNet: number;
  model?: string;
  productId?: string;
  productName?: string;
  productVariantId?: string;
  quantity: number;
  sku?: string;
  totalAmount: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  customerEmail?: string;
  customerId?: string;
  customerName?: string;
  createdAt?: string;
  deliveredAt?: string;
  deliveryAddress?: string;
  discountAmount: number;
  items: OrderItem[];
  note?: string;
  orderTime?: string;
  payments: PaymentSummary[];
  recipientName?: string;
  recipientPhone?: string;
  shippingFee: number;
  shippingMethodCode?: string;
  status?: OrderStatus | string;
  subtotalAmount: number;
  totalAmount: number;
};

export type OrdersPage = {
  hasNext: boolean;
  hasPrev: boolean;
  items: Order[];
  nextCursor?: string;
  prevCursor?: string;
  size: number;
};

export type PaymentMethod = {
  id: string;
  code: string;
  name: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ShippingMethod = {
  id: string;
  code: string;
  name: string;
  fee: number;
  status?: string;
};

export type PaymentIntent = {
  amount: number;
  clientSecret?: string;
  currency?: string;
  orderId?: string;
  paymentId?: string;
  publishableKey?: string;
};

export type DiscountValidation = {
  code?: string;
  discountAmount: number;
  discountId?: string;
  finalAmount: number;
  isValid: boolean;
  message?: string;
  title?: string;
};

export type Invoice = {
  customerName?: string;
  deliveryAddress?: string;
  discountAmount: number;
  invoiceId?: string;
  issuedAt?: string;
  items: OrderItem[];
  orderId?: string;
  paymentMethodCode?: string;
  paymentStatus?: string;
  recipientName?: string;
  recipientPhone?: string;
  shippingFee: number;
  subtotalAmount: number;
  totalAmount: number;
};

export type InvoicesPage = {
  hasNext: boolean;
  hasPrev: boolean;
  items: Invoice[];
  nextCursor?: string;
  prevCursor?: string;
  size: number;
};
