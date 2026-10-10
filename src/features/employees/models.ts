export type Employee = {
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
  address?: string;
  avatarFileId?: string;
  avatarUrl?: string;
  createdAt?: string;
};

export type EmployeePage = {
  items: Employee[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};
