/** An employee as identity-service shows it to the admin. */
export type EmployeeDto = {
  accountId: string;
  email: string;
  phone: string;
  status: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthday?: string | null;
  address?: string | null;
  avatarFileId?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
};

/** identity-service page of employees: by page number, with totals. */
export type EmployeePageDto = {
  content: EmployeeDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};
