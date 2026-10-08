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

/** What the customer sees of an order: the snapshot taken when it was placed. */
export type OrderLine = {
  id: string;
  productVariantId?: string;
  productName: string;
  sku?: string;
  variantLabel?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
};

export type OrderPayment = {
  id: string;
  paymentMethodId?: string;
  amount: number;
  status: string;
  paidAt?: string;
  createdAt?: string;
};

export type OrderDetail = {
  id: string;
  invoiceNumber: string;
  status: string;
  cancellationReason?: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  note?: string;
  shippingMethodId?: string;
  paymentMethodId?: string;
  items: OrderLine[];
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  payments: OrderPayment[];
  createdAt?: string;
  deliveredAt?: string;
};

export type OrderSummary = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  firstProductName?: string;
  createdAt?: string;
};

/** Orders are paged by cursor, forward only. */
export type OrderSummaryPage = {
  items: OrderSummary[];
  nextCursor?: string;
  hasNext: boolean;
  size: number;
};

export type VnpayResult = {paymentId: string; orderId: string; result: "PAID" | "FAILED" | "CANCELLED" | "PENDING"; amount: number};

export type DiscountPreview = {
  /** Sum of the line discounts. */
  itemDiscountAmount: number;
  /** The voucher taken off the order. */
  orderDiscountAmount: number;
  lineDiscounts: Record<string, number>;
};
