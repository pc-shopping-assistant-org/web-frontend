import {backendFetch} from "@/lib/api/client";
import {parseRequest} from "@/lib/api/parse-request";

import {updatePaymentStatusRequestSchema} from "./contracts/requests";
import type {AdminPaymentDto, AdminPaymentMethodDto, AdminPaymentPageDto} from "./contracts/dto";
import {mapAdminPayment, mapAdminPaymentMethod, mapAdminPaymentPage} from "./mappers";

const PAYMENT = "/payment-service";

export type AdminPaymentFilters = {
  page?: number;
  size?: number;
  transactionCode?: string;
  customerName?: string;
  orderId?: string;
  status?: string;
  createdFrom?: string;
  createdTo?: string;
};

/** Every customer's payments, for the shop. */
export async function getAdminPayments(filters: AdminPaymentFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return mapAdminPaymentPage(await backendFetch<AdminPaymentPageDto>(
    `${PAYMENT}/payments/admin${params.size ? `?${params.toString()}` : ""}`,
  ));
}

/** Cash collected on delivery (PAID) or a payment given back (REFUNDED); the backend refuses any other change. */
export async function updateAdminPaymentStatus(paymentId: string, status: string) {
  const payload = parseRequest(updatePaymentStatusRequestSchema, {status});
  return mapAdminPayment(await backendFetch<AdminPaymentDto>(`${PAYMENT}/payments/admin/${encodeURIComponent(paymentId)}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }));
}

export async function getAdminPaymentMethods() {
  return (await backendFetch<AdminPaymentMethodDto[]>(`${PAYMENT}/payment-methods/admin`)).map(mapAdminPaymentMethod);
}
