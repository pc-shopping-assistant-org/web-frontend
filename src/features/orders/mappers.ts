import type {
  DiscountValidationDto,
  InvoiceDto,
  InvoicesPageDto,
  OrderDto,
  OrderItemDto,
  OrdersPageDto,
  PaymentIntentDto,
  PaymentMethodDto,
  PaymentSummaryDto,
  ShippingMethodDto,
} from "@/features/orders/contracts/dto";
import type {
  DiscountValidation,
  Invoice,
  InvoicesPage,
  Order,
  OrderItem,
  OrdersPage,
  PaymentIntent,
  PaymentMethod,
  PaymentSummary,
  ShippingMethod,
} from "@/features/orders/models";

const text = (value?: string) => value?.trim() ?? "";
const number = (value?: number) => value ?? 0;

export function mapPaymentSummary(dto: PaymentSummaryDto): PaymentSummary {
  return {
    id: text(dto.id),
    amount: number(dto.amount),
    paidAt: dto.paidAt,
    paymentMethodCode: dto.paymentMethodCode,
    providerTransactionCode: dto.providerTransactionCode,
    status: dto.status,
  };
}

export function mapOrderItem(dto: OrderItemDto): OrderItem {
  return {
    id: text(dto.id),
    imageUrl: dto.imageUrl,
    itemDiscount: number(dto.itemDiscount),
    itemGross: number(dto.itemGross),
    itemNet: number(dto.itemNet),
    model: dto.model,
    productId: dto.productId,
    productName: dto.productName,
    productVariantId: dto.productVariantId,
    quantity: number(dto.quantity),
    sku: dto.sku,
    totalAmount: number(dto.totalAmount),
    unitPrice: number(dto.unitPrice),
  };
}

export function mapOrder(dto: OrderDto): Order {
  return {
    id: text(dto.id),
    customerEmail: dto.customerEmail,
    customerId: dto.customerId,
    customerName: dto.customerName,
    createdAt: dto.createdAt,
    deliveredAt: dto.deliveredAt,
    deliveryAddress: dto.deliveryAddress,
    discountAmount: number(dto.discountAmount),
    items: (dto.items ?? []).map(mapOrderItem),
    note: dto.note,
    orderTime: dto.orderTime,
    payments: (dto.payments ?? []).map(mapPaymentSummary),
    recipientName: dto.recipientName,
    recipientPhone: dto.recipientPhone,
    shippingFee: number(dto.shippingFee),
    shippingMethodCode: dto.shippingMethodCode,
    status: dto.status,
    subtotalAmount: number(dto.subtotalAmount),
    totalAmount: number(dto.totalAmount),
  };
}

export function mapOrdersPage(dto: OrdersPageDto): OrdersPage {
  return {
    hasNext: dto.hasNext ?? false,
    hasPrev: dto.hasPrev ?? false,
    items: (dto.items ?? []).map(mapOrder),
    nextCursor: dto.nextCursor,
    prevCursor: dto.prevCursor,
    size: number(dto.size),
  };
}

export function mapPaymentMethod(dto: PaymentMethodDto): PaymentMethod {
  return {
    id: text(dto.id),
    code: text(dto.code),
    name: text(dto.name),
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapShippingMethod(dto: ShippingMethodDto): ShippingMethod {
  return {
    id: text(dto.id),
    code: text(dto.code),
    name: text(dto.name),
    fee: number(dto.fee),
    status: dto.status,
  };
}

export function mapPaymentIntent(dto: PaymentIntentDto): PaymentIntent {
  return {
    amount: number(dto.amount),
    clientSecret: dto.clientSecret,
    currency: dto.currency,
    orderId: dto.orderId,
    paymentId: dto.paymentId,
    publishableKey: dto.publishableKey,
  };
}

export function mapDiscountValidation(dto: DiscountValidationDto): DiscountValidation {
  return {
    code: dto.code,
    discountAmount: number(dto.discountAmount),
    discountId: dto.discountId,
    finalAmount: number(dto.finalAmount),
    isValid: dto.isValid ?? false,
    message: dto.message,
    title: dto.title,
  };
}

export function mapInvoice(dto: InvoiceDto): Invoice {
  return {
    customerName: dto.customerName,
    deliveryAddress: dto.deliveryAddress,
    discountAmount: number(dto.discountAmount),
    invoiceId: dto.invoiceId,
    issuedAt: dto.issuedAt,
    items: (dto.items ?? []).map(mapOrderItem),
    orderId: dto.orderId,
    paymentMethodCode: dto.paymentMethodCode,
    paymentStatus: dto.paymentStatus,
    recipientName: dto.recipientName,
    recipientPhone: dto.recipientPhone,
    shippingFee: number(dto.shippingFee),
    subtotalAmount: number(dto.subtotalAmount),
    totalAmount: number(dto.totalAmount),
  };
}

export function mapInvoicesPage(dto: InvoicesPageDto): InvoicesPage {
  return {
    hasNext: dto.hasNext ?? false,
    hasPrev: dto.hasPrev ?? false,
    items: (dto.items ?? []).map(mapInvoice),
    nextCursor: dto.nextCursor,
    prevCursor: dto.prevCursor,
    size: number(dto.size),
  };
}

import type {
  CheckoutPaymentMethodDto,
  CheckoutShippingMethodDto,
  AdminOrderDetailDto,
  AdminOrderPageDto,
  AdminOrderSummaryDto,
  DiscountPreviewDto,
  OrderDetailDto,
  OrderSummaryDto,
  OrderSummaryPageDto,
} from "@/features/orders/contracts/dto";
import type {
  AdminOrderDetail,
  AdminOrderPage,
  AdminOrderSummary,
  DiscountPreview,
  OrderDetail,
  OrderSummary,
  OrderSummaryPage,
} from "@/features/orders/models";

export function mapOrderDetail(dto: OrderDetailDto): OrderDetail {
  return {
    id: dto.id,
    invoiceNumber: dto.invoiceNumber,
    status: dto.status,
    cancellationReason: dto.cancellationReason ?? undefined,
    recipientName: dto.recipientName ?? undefined,
    recipientPhone: dto.recipientPhone ?? undefined,
    deliveryAddress: dto.deliveryAddress ?? undefined,
    note: dto.note ?? undefined,
    shippingMethodId: dto.shippingMethodId ?? undefined,
    paymentMethodId: dto.paymentMethodId ?? undefined,
    items: (dto.items ?? []).map((line) => ({
      id: line.id,
      productVariantId: line.productVariantId ?? undefined,
      productName: text(line.productName ?? undefined),
      sku: line.sku ?? undefined,
      variantLabel: line.variantLabel ?? undefined,
      quantity: number(line.quantity),
      unitPrice: number(line.unitPrice),
      discountAmount: number(line.discountAmount),
      lineTotal: number(line.lineTotal),
    })),
    subtotalAmount: number(dto.subtotalAmount),
    discountAmount: number(dto.discountAmount),
    shippingFee: number(dto.shippingFee),
    totalAmount: number(dto.totalAmount),
    payments: (dto.payments ?? []).map((payment) => ({
      id: payment.id,
      paymentMethodId: payment.paymentMethodId ?? undefined,
      amount: number(payment.amount),
      status: payment.status,
      paidAt: payment.paidAt ?? undefined,
      createdAt: payment.createdAt ?? undefined,
    })),
    createdAt: dto.createdAt ?? undefined,
    deliveredAt: dto.deliveredAt ?? undefined,
  };
}

export function mapOrderSummary(dto: OrderSummaryDto): OrderSummary {
  return {
    id: dto.id,
    invoiceNumber: dto.invoiceNumber,
    status: dto.status,
    totalAmount: number(dto.totalAmount),
    itemCount: number(dto.itemCount),
    firstProductName: dto.firstProductName ?? undefined,
    createdAt: dto.createdAt ?? undefined,
  };
}

export function mapOrderSummaryPage(dto: OrderSummaryPageDto): OrderSummaryPage {
  return {
    items: (dto.items ?? []).map(mapOrderSummary),
    nextCursor: dto.nextCursor ?? undefined,
    hasNext: dto.hasNext ?? false,
    size: number(dto.size),
  };
}

export function mapAdminOrderDetail(dto: AdminOrderDetailDto): AdminOrderDetail {
  return {
    ...mapOrderDetail(dto),
    customerId: dto.customerId ?? undefined,
    statusHistory: (dto.statusHistory ?? []).map((change) => ({
      fromStatus: change.fromStatus ?? undefined,
      toStatus: change.toStatus,
      changedBy: change.changedBy ?? undefined,
      reason: change.reason ?? undefined,
      createdAt: change.createdAt ?? undefined,
    })),
  };
}

function mapAdminOrderSummary(dto: AdminOrderSummaryDto): AdminOrderSummary {
  return {
    ...mapOrderSummary(dto),
    customerId: dto.customerId ?? undefined,
    recipientName: dto.recipientName ?? undefined,
    recipientPhone: dto.recipientPhone ?? undefined,
  };
}

export function mapAdminOrderPage(dto: AdminOrderPageDto): AdminOrderPage {
  return {
    items: (dto.content ?? []).map(mapAdminOrderSummary),
    page: number(dto.page),
    size: number(dto.size),
    totalElements: number(dto.totalElements),
    totalPages: number(dto.totalPages),
    last: dto.last ?? true,
  };
}

export const mapCheckoutPaymentMethod = (dto: CheckoutPaymentMethodDto): PaymentMethod => ({id: dto.id, code: dto.code, name: dto.name});
export const mapCheckoutShippingMethod = (dto: CheckoutShippingMethodDto): ShippingMethod => ({
  id: dto.id,
  code: dto.code,
  name: dto.name,
  fee: number(dto.fee),
});

export function mapDiscountPreview(dto: DiscountPreviewDto): DiscountPreview {
  const lineDiscounts: Record<string, number> = {};
  for (const line of dto.itemDiscounts ?? []) lineDiscounts[line.productVariantId] = number(line.discountAmount);
  return {
    itemDiscountAmount: Object.values(lineDiscounts).reduce((sum, amount) => sum + amount, 0),
    orderDiscountAmount: number(dto.orderDiscountAmount),
    lineDiscounts,
  };
}
