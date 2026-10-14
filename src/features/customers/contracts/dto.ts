/** A customer as identity-service shows it to the shop. */
export type CustomerDto = {
  accountId: string;
  email: string;
  phone: string;
  status: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthday?: string | null;
  avatarFileId?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
};

export type CustomerAddressDto = {
  id: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  isDefault: boolean;
};

export type CustomerDetailDto = CustomerDto & {addresses?: CustomerAddressDto[] | null};

/** identity-service page of customers: by page number, with totals. */
export type CustomerPageDto = {
  content: CustomerDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};
