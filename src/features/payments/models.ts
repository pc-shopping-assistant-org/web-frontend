export type AdminPayment = {
  id: string;
  orderId: string;
  customerId?: string;
  paymentMethodId: string;
  amount: number;
  status: string;
  providerTransactionCode?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
  /** The employee who last changed it by hand; absent when only the gateway or the system did. */
  updatedBy?: string;
};

export type AdminPaymentPage = {
  items: AdminPayment[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type AdminPaymentMethod = {id: string; code: string; name: string; status: string};
