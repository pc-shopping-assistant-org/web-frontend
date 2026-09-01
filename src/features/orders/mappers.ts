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
