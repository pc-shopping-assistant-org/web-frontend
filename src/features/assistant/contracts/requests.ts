import {z} from "zod";

import {
  AI_MODE_VALUES,
} from "@/lib/domain/assistant-enums";
import {nonEmptyText, uuid} from "@/lib/api/contracts/primitives";

export const chatRequestSchema = z.object({
  message: nonEmptyText.max(4000),
  conversation_id: z.uuid().nullable().optional(),
}).strict();

export const semanticSearchRequestSchema = z.object({
  query: nonEmptyText.max(1000),
  limit: z.number().int().positive().max(50).default(10),
}).strict();

export const consultRequestSchema = z.object({
  query: nonEmptyText.max(4000),
  limit: z.number().int().positive().max(50).default(5),
}).strict();

export const compareRequestSchema = z.object({
  product_ids: z.array(uuid).min(2).max(5),
  question: z.string().trim().max(1000).nullable().optional(),
}).superRefine((value, context) => {
  if (new Set(value.product_ids).size !== value.product_ids.length) {
    context.addIssue({
      code: "custom",
      path: ["product_ids"],
      message: "product_ids must contain distinct products",
    });
  }
}).strict();

export const evaluateRequestSchema = z.object({
  product_id: uuid,
  question: z.string().trim().max(1000).nullable().optional(),
}).strict();

export const aiModeSchema = z.enum(AI_MODE_VALUES);

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type SemanticSearchRequest = z.infer<typeof semanticSearchRequestSchema>;
export type ConsultRequest = z.infer<typeof consultRequestSchema>;
export type CompareRequest = z.infer<typeof compareRequestSchema>;
export type EvaluateRequest = z.infer<typeof evaluateRequestSchema>;
export type AiModeRequest = z.infer<typeof aiModeSchema>;
