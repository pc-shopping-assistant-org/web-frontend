import type {EmployeeDto, EmployeePageDto} from "./contracts/dto";
import type {Employee, EmployeePage} from "./models";

export function mapEmployee(dto: EmployeeDto): Employee {
  return {
    accountId: dto.accountId,
    email: dto.email,
    phone: dto.phone,
    status: dto.status,
    firstName: dto.firstName,
    lastName: dto.lastName,
    fullName: `${dto.lastName} ${dto.firstName}`.trim(),
    gender: dto.gender,
    birthday: dto.birthday ?? undefined,
    address: dto.address ?? undefined,
    avatarFileId: dto.avatarFileId ?? undefined,
    avatarUrl: dto.avatarUrl ?? undefined,
    createdAt: dto.createdAt ?? undefined,
  };
}

export function mapEmployeePage(dto: EmployeePageDto): EmployeePage {
  return {
    items: (dto.content ?? []).map(mapEmployee),
    page: dto.page ?? 0,
    size: dto.size ?? 0,
    totalElements: dto.totalElements ?? 0,
    totalPages: dto.totalPages ?? 0,
    last: dto.last ?? true,
  };
}
