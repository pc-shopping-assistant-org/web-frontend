import {z} from "zod";

import {
  nonEmptyText,
  phone,
} from "@/lib/api/contracts/primitives";

export const customerAddressRequestSchema = z.object({
  recipientName: nonEmptyText,
  phone,
  addressLine: nonEmptyText,
  default: z.boolean().optional(),
}).strict();

export type CustomerAddressRequest = z.infer<typeof customerAddressRequestSchema>;
