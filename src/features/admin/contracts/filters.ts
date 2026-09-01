/** Query filters owned by the admin adapter; they are not UI response models. */
export type AdminProductFilter = {
  cursor?: string;
  limit?: number;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: string;
};

export type CustomerFilter = {
  cursor?: string;
  limit?: number;
  keyword?: string;
  status?: string;
  queryLimit?: number;
  sanitizedLimit?: number;
};

export type EmployeeFilter = CustomerFilter & {roleName?: string};
export type SupplierFilter = CustomerFilter;

export type DiscountFilter = {
  cursor?: string;
  limit?: number;
  keyword?: string;
  status?: string;
  discountType?: string;
  applicationScope?: string;
};

export type OrderFilter = {
  cursor?: string;
  limit?: number;
  keyword?: string;
  status?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
};

export type PaymentFilter = {
  cursor?: string;
  limit?: number;
  keyword?: string;
  status?: string;
  orderId?: string;
  paymentMethodCode?: string;
  providerTransactionCode?: string;
  fromDate?: string;
  toDate?: string;
};

export type ReviewFilter = {
  cursor?: string;
  limit?: number;
  keyword?: string;
  productId?: string;
  rating?: number;
  status?: string;
};

export type InvoiceFilter = {
  cursor?: string;
  limit?: number;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
  queryLimit?: number;
  sanitizedLimit?: number;
};
