import type {AdminPaymentDto, AdminPaymentMethodDto, AdminPaymentPageDto} from "./contracts/dto";
import type {AdminPayment, AdminPaymentMethod, AdminPaymentPage} from "./models";

export function mapAdminPayment(dto: AdminPaymentDto): AdminPayment {
  return {
    id: dto.id,
    orderId: dto.orderId,
    customerId: dto.customerId ?? undefined,
    paymentMethodId: dto.paymentMethodId,
    amount: dto.amount ?? 0,
    status: dto.status,
    providerTransactionCode: dto.providerTransactionCode ?? undefined,
    paidAt: dto.paidAt ?? undefined,
    createdAt: dto.createdAt ?? undefined,
    updatedAt: dto.updatedAt ?? undefined,
    updatedBy: dto.updatedBy ?? undefined,
  };
}

export function mapAdminPaymentPage(dto: AdminPaymentPageDto): AdminPaymentPage {
  return {
    items: (dto.content ?? []).map(mapAdminPayment),
    page: dto.page ?? 0,
    size: dto.size ?? 0,
    totalElements: dto.totalElements ?? 0,
    totalPages: dto.totalPages ?? 0,
    last: dto.last ?? true,
  };
}

export const mapAdminPaymentMethod = (dto: AdminPaymentMethodDto): AdminPaymentMethod => ({
  id: dto.id,
  code: dto.code,
  name: dto.name,
  status: dto.status,
});
