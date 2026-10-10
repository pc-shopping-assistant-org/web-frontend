import type {CustomerAddressDto, CustomerDetailDto, CustomerDto, CustomerPageDto} from "./contracts/dto";
import type {Customer, CustomerAddress, CustomerDetail, CustomerPage} from "./models";

export function mapCustomer(dto: CustomerDto): Customer {
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
    avatarFileId: dto.avatarFileId ?? undefined,
    avatarUrl: dto.avatarUrl ?? undefined,
    createdAt: dto.createdAt ?? undefined,
  };
}

const mapAddress = (dto: CustomerAddressDto): CustomerAddress => ({
  id: dto.id,
  recipientName: dto.recipientName,
  phone: dto.phone,
  addressLine: dto.addressLine,
  isDefault: dto.isDefault,
});

export function mapCustomerDetail(dto: CustomerDetailDto): CustomerDetail {
  return {...mapCustomer(dto), addresses: (dto.addresses ?? []).map(mapAddress)};
}

export function mapCustomerPage(dto: CustomerPageDto): CustomerPage {
  return {
    items: (dto.content ?? []).map(mapCustomer),
    page: dto.page ?? 0,
    size: dto.size ?? 0,
    totalElements: dto.totalElements ?? 0,
    totalPages: dto.totalPages ?? 0,
    last: dto.last ?? true,
  };
}
