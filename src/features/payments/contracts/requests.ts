import {z} from "zod";

import {PaymentStatus} from "@/lib/domain/commerce-enums";

/** The shop settles only two changes: cash collected on delivery (PAID) and a payment given back (REFUNDED). */
export const updatePaymentStatusRequestSchema = z.object({
  status: z.enum([PaymentStatus.Paid, PaymentStatus.Refunded]),
}).strict();
