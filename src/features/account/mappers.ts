import type {CustomerAddressDto} from "@/features/account/contracts/dto";
import type {CustomerAddress} from "@/features/account/models";

export function mapCustomerAddress(dto: CustomerAddressDto): CustomerAddress {
  return {
    id: dto.id,
    addressLine: dto.addressLine,
    default: dto.isDefault,
    phone: dto.phone,
    recipientName: dto.recipientName,
  };
}
