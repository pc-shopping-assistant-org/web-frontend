import type {CustomerAddressDto} from "@/features/account/contracts/dto";
import type {CustomerAddress} from "@/features/account/models";

const text = (value?: string) => value?.trim() ?? "";

export function mapCustomerAddress(dto: CustomerAddressDto): CustomerAddress {
  return {
    id: text(dto.id),
    addressLine: text(dto.addressLine),
    createdAt: dto.createdAt,
    default: dto.default ?? false,
    phone: text(dto.phone),
    recipientName: text(dto.recipientName),
    updatedAt: dto.updatedAt,
  };
}
