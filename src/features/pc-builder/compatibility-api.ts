import {z} from "zod";
import {aiFetch} from "@/lib/api/client";

export const CompatibilityStatus = {
  OK: "OK",
  WARNING: "WARNING",
  UNKNOWN: "UNKNOWN",
  INCOMPATIBLE: "INCOMPATIBLE",
} as const;
export type CompatibilityStatus = (typeof CompatibilityStatus)[keyof typeof CompatibilityStatus];

const statusSchema = z.enum(["OK", "WARNING", "UNKNOWN", "INCOMPATIBLE"]);

/** One check between two slots, as the AI service sends it (snake_case) and as the page reads it. */
export const ruleResultSchema = z
  .object({
    rule: z.string(),
    status: statusSchema,
    slot_a: z.string(),
    slot_b: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
    suggestion: z.string().nullable().optional(),
    missing_attributes: z.array(z.string()).default([]),
  })
  .transform((result) => ({
    rule: result.rule,
    status: result.status,
    slotA: result.slot_a,
    slotB: result.slot_b ?? "",
    message: result.message ?? null,
    suggestion: result.suggestion ?? null,
    missingAttributes: result.missing_attributes,
  }));
export type RuleResult = z.infer<typeof ruleResultSchema>;

const powerSchema = z
  .object({
    estimated_tdp_watts: z.number(),
    recommended_psu_watts: z.number(),
    selected_psu_watts: z.number().nullable().optional(),
    is_sufficient: z.boolean().nullable().optional(),
  })
  .transform((power) => ({
    estimatedWatts: power.estimated_tdp_watts,
    recommendedPsuWatts: power.recommended_psu_watts,
    psuWatts: power.selected_psu_watts ?? null,
    sufficient: power.is_sufficient ?? null,
  }));

export const compatibilityResponseSchema = z.object({
  overall: statusSchema,
  results: z.array(ruleResultSchema),
  power: powerSchema.nullable().optional(),
});
export type CompatibilityResponse = z.infer<typeof compatibilityResponseSchema>;

export type CompatibilityCheckRequest = {
  slots: Record<string, string>;
};

/**
 * Checks the chosen parts against each other with the AI service's rule engine (POST /compatibility/check). The
 * service reads each variant's specs from the catalog itself, so only the variant id of every slot is sent. It needs
 * no sign-in, so a visitor who is not logged in gets the same answer.
 */
export async function checkCompatibility(slots: Record<string, string>, signal?: AbortSignal): Promise<CompatibilityResponse> {
  const payload = await aiFetch<unknown>("/compatibility/check", {
    method: "POST",
    body: JSON.stringify({slots}),
    signal,
  });
  return compatibilityResponseSchema.parse(payload);
}

/** The AI service rejects a request with more candidates than this (MAX_CANDIDATES in build_check.py). */
const MAX_CANDIDATES_PER_CALL = 100;

export type CandidateVerdict = "COMPATIBLE" | "INCOMPATIBLE" | "UNKNOWN";

const candidatesResponseSchema = z.object({
  verdicts: z.record(z.string(), z.enum(["COMPATIBLE", "INCOMPATIBLE", "UNKNOWN"])),
});

/**
 * For every variant on offer for `slot`, asks the AI service whether it fits the parts already chosen for the other
 * slots (POST /compatibility/candidates). Returns a verdict per variant id.
 */
export async function checkCandidates(
  slots: Record<string, string>,
  slot: string,
  candidates: string[],
  signal?: AbortSignal,
): Promise<Record<string, CandidateVerdict>> {
  // The service takes at most MAX_CANDIDATES_PER_CALL at a time, so a long category goes out as parallel batches.
  const batches: string[][] = [];
  for (let start = 0; start < candidates.length; start += MAX_CANDIDATES_PER_CALL) {
    batches.push(candidates.slice(start, start + MAX_CANDIDATES_PER_CALL));
  }
  const answers = await Promise.all(
    batches.map(async (batch) => {
      const payload = await aiFetch<unknown>("/compatibility/candidates", {
        method: "POST",
        body: JSON.stringify({slots, slot, candidates: batch}),
        signal,
      });
      return candidatesResponseSchema.parse(payload).verdicts;
    }),
  );
  return Object.assign({}, ...answers) as Record<string, CandidateVerdict>;
}
