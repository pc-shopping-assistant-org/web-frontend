import {z} from "zod";
import {ChatStreamEventType, FlexibleTurnStatus, RequirementOperation, RequirementValueKind} from "@/lib/domain/assistant-enums";
import {MAX_SELECTED_PRODUCTS, MAX_TURN_MESSAGE_CHARS, STATEFUL_SCHEMA_VERSION} from "../constants";
import {productCardStreamSchema} from "./stream";

export const confirmationSchema = z.object({
  schema_version: z.literal(STATEFUL_SCHEMA_VERSION).default(STATEFUL_SCHEMA_VERSION),
  proposal_id: z.uuid(),
  proposal_hash: z.string().regex(/^[0-9a-f]{64}$/),
  target_revision: z.number().int().nonnegative(),
  base_requirements_hash: z.string().regex(/^[0-9a-f]{64}$/),
});

export const proposalSchema = confirmationSchema.omit({schema_version: true}).extend({
  changes: z
    .array(
      z
        .object({
          operation: z.enum(RequirementOperation),
          target: z.string(),
          subject: z.string().nullable().optional(),
          predicate: z.string().nullable().optional(),
          variant_id: z.uuid().nullable().optional(),
          value: z
            .union([
              z.object({kind: z.literal(RequirementValueKind.Text), text: z.string()}),
              z.object({kind: z.literal(RequirementValueKind.Quantity), amount: z.number(), unit: z.string()}),
              z.object({kind: z.literal(RequirementValueKind.Reference), variant_id: z.uuid()}),
            ])
            .nullable()
            .optional(),
        })
        .passthrough(),
    )
    .default([]),
});

export const publicBuildSchema = z.object({
  total_spending_vnd: z.number().int().nonnegative(),
  stale: z.boolean(),
  parts: z.array(
    z.object({
      slot: z.string(),
      name: z.string(),
      variant_id: z.uuid().nullable(),
      spending_vnd: z.number().int().nonnegative(),
      is_owned: z.boolean().default(false),
      is_pinned: z.boolean().default(false),
    }),
  ),
});

export const flexibleSchema = z.object({
  status: z.enum(FlexibleTurnStatus),
  answer: z.string(),
  proposal: proposalSchema.nullable().optional(),
  clarification: z
    .object({
      items: z.array(
        z.object({
          reason: z.string(),
          options: z.array(z.object({name: z.string(), sku: z.string()})).default([]),
          quantity_amount: z.number().nullable().optional(),
          unit_options: z.array(z.string()).default([]),
        }),
      ),
    })
    .nullable()
    .optional(),
  task_clarification: z
    .object({
      items: z.array(
        z.object({
          reason: z.string(),
          mention: z.string(),
          options: z.array(z.object({name: z.string()})).default([]),
        }),
      ),
    })
    .nullable()
    .optional(),
});

export const conversationSchema = z.object({
  schema_version: z.literal(STATEFUL_SCHEMA_VERSION),
  conversation_id: z.uuid(),
  revision: z.number().int().nonnegative(),
  flexible: flexibleSchema.nullable().optional(),
  build: publicBuildSchema.nullable().optional(),
});

export const runSchema = z.object({
  conversation_id: z.uuid(),
  run_id: z.uuid(),
  request_id: z.uuid(),
  status: z.string(),
  base_revision: z.number().int().nonnegative(),
});

export const turnRequestSchema = z
  .object({
    schema_version: z.literal(STATEFUL_SCHEMA_VERSION),
    conversation_id: z.uuid(),
    request_id: z.uuid(),
    expected_revision: z.number().int().nonnegative(),
    message: z.string().trim().min(1).max(MAX_TURN_MESSAGE_CHARS),
    selected_product_ids: z.array(z.uuid()).max(MAX_SELECTED_PRODUCTS).optional(),
    confirmation: confirmationSchema.optional(),
  })
  .strict();

export const turnResultSchema = conversationSchema.omit({conversation_id: true}).extend({
  run: runSchema,
  answer: z.string(),
  products: z.array(productCardStreamSchema).default([]),
});

const identity = z.object({conversation_id: z.uuid(), run_id: z.uuid(), sequence: z.number().int().positive()});
export const statefulEventSchema = z.discriminatedUnion("event", [
  identity.extend({event: z.literal(ChatStreamEventType.Start), run: runSchema}),
  identity.extend({event: z.literal(ChatStreamEventType.Delta), delta: z.string()}),
  identity.extend({event: z.literal(ChatStreamEventType.Completed), result: turnResultSchema}),
  identity.extend({event: z.literal(ChatStreamEventType.Error), code: z.string()}),
]);

export type Confirmation = z.infer<typeof confirmationSchema>;
export type StatefulTurnResult = z.infer<typeof turnResultSchema>;
