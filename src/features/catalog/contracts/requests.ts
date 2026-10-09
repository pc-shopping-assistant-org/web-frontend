import {z} from "zod";

import {uuid} from "@/lib/api/contracts/primitives";

export const REVIEW_COMMENT_MAX_LENGTH = 2000;
const rating = z.number().int().min(1).max(5);

export const createReviewRequestSchema = z.object({
  orderItemId: uuid,
  rating,
  comment: z.string().trim().max(REVIEW_COMMENT_MAX_LENGTH).transform((value) => value || undefined).optional(),
}).strict();

/** An empty comment is sent as is: it clears the comment, while an absent one keeps it. */
export const editReviewRequestSchema = z.object({
  rating: rating.optional(),
  comment: z.string().trim().max(REVIEW_COMMENT_MAX_LENGTH).optional(),
}).strict().refine((value) => value.rating !== undefined || value.comment !== undefined, {message: "Send a rating or a comment"});

export type CreateReviewRequest = z.infer<typeof createReviewRequestSchema>;
export type EditReviewRequest = z.infer<typeof editReviewRequestSchema>;
