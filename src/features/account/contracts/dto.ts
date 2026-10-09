/** identity-service address shape, kept inside the account adapter. */
export type CustomerAddressDto = {
  id: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  isDefault: boolean;
};
