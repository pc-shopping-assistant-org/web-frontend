import {z} from "zod";

import {optionalText, uuid} from "@/lib/api/contracts/primitives";

export const createReviewRequestSchema = z.object({
  orderItemId: uuid,
  rating: z.number().int().min(1).max(5),
  comment: optionalText,
}).strict();

export type CreateReviewRequest = z.infer<typeof createReviewRequestSchema>;
