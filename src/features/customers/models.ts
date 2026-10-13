export type Customer = {
  accountId: string;
  email: string;
  phone: string;
  status: string;
  firstName: string;
  lastName: string;
  /** Family name first, as it is written in Vietnamese. */
  fullName: string;
  gender: string;
  birthday?: string;
  avatarFileId?: string;
  avatarUrl?: string;
  createdAt?: string;
};

export type CustomerAddress = {
  id: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  isDefault: boolean;
};

export type CustomerDetail = Customer & {addresses: CustomerAddress[]};

export type CustomerPage = {
  items: Customer[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};
