import {z} from "zod";

import {
  AI_MODE_VALUES,
} from "@/lib/domain/assistant-enums";
import {nonEmptyText, uuid} from "@/lib/api/contracts/primitives";
import {MAX_PRODUCT_QUESTION_CHARS, MAX_SELECTED_PRODUCTS, MAX_TURN_MESSAGE_CHARS, MIN_COMPARISON_PRODUCTS} from "../constants";

export const chatRequestSchema = z.object({
  message: nonEmptyText.max(MAX_TURN_MESSAGE_CHARS),
  conversation_id: z.uuid().nullable().optional(),
}).strict();

export const semanticSearchRequestSchema = z.object({
  query: nonEmptyText.max(1000),
  limit: z.number().int().positive().max(50).default(10),
}).strict();

export const consultRequestSchema = z.object({
  query: nonEmptyText.max(MAX_TURN_MESSAGE_CHARS),
  limit: z.number().int().positive().max(50).default(5),
}).strict();

export const compareRequestSchema = z.object({
  product_ids: z.array(uuid).min(MIN_COMPARISON_PRODUCTS).max(MAX_SELECTED_PRODUCTS),
  question: z.string().trim().max(MAX_PRODUCT_QUESTION_CHARS).nullable().optional(),
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
  question: z.string().trim().max(MAX_PRODUCT_QUESTION_CHARS).nullable().optional(),
}).strict();

export const aiModeSchema = z.enum(AI_MODE_VALUES);

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type SemanticSearchRequest = z.infer<typeof semanticSearchRequestSchema>;
export type ConsultRequest = z.infer<typeof consultRequestSchema>;
export type CompareRequest = z.infer<typeof compareRequestSchema>;
export type EvaluateRequest = z.infer<typeof evaluateRequestSchema>;
export type AiModeRequest = z.infer<typeof aiModeSchema>;
