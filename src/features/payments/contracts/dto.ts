/** A payment as payment-service shows it to the shop. */
export type AdminPaymentDto = {
  id: string;
  orderId: string;
  customerId?: string | null;
  paymentMethodId: string;
  amount: number;
  status: string;
  providerTransactionCode?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

/** payment-service page of the shop: by page number, with totals. */
export type AdminPaymentPageDto = {
  content: AdminPaymentDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type AdminPaymentMethodDto = {id: string; code: string; name: string; status: string};
