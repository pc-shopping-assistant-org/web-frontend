import {z} from "zod";

import {
  CHAT_STREAM_EVENT_VALUES,
} from "@/lib/domain/assistant-enums";

const productCardStreamSchema = z
  .object({
    id: z.uuid().nullable().optional(),
    name: z.string(),
    seo_name: z.string().nullable().optional(),
    list_price: z.number().nullable().optional(),
    image_url: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    specifications: z.record(z.string(), z.unknown()).default({}),
    description: z.string().nullable().optional(),
  })
  .passthrough();

const chatDataStreamSchema = z
  .object({
    conversation_id: z.uuid(),
    intent: z.string(),
    answer: z.string(),
    products: z.array(productCardStreamSchema).default([]),
  })
  .passthrough();

export const chatStreamEventSchema = z
  .object({
    event: z.enum(CHAT_STREAM_EVENT_VALUES),
    conversation_id: z.uuid().nullable().optional(),
    delta: z.string().nullable().optional(),
    result: chatDataStreamSchema.nullable().optional(),
  })
  .passthrough();

export type ChatStreamEventDto = z.infer<typeof chatStreamEventSchema>;
