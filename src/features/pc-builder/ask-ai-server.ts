import {getServerEnv} from "@/lib/config/env";
import type {ProductDetailDto} from "@/features/catalog/contracts/dto";
import {mapSnapshotProductToParts} from "./api";
import {buildQuestion} from "./ask-ai";
import type {Selection, Slot} from "./contracts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_QUESTION_LENGTH = 4000;
const REQUEST_TIMEOUT_MS = 15_000;
/** Spec keys that say what a part is; the rest of a catalog entry is marketing detail the model does not need. */
const SPEC_KEYS = [
  "socket", "ram_type", "form_factor", "supported_form_factors", "memory_type", "capacity", "speed", "cores", "threads",
  "tdp_watts", "wattage", "efficiency", "gpu_length_mm", "max_gpu_length_mm", "cooler_height_mm", "max_cooler_height_mm",
  "supported_sockets", "chipset", "vram", "interface",
];

type Envelope<T> = {data: T | null};
type VariantDto = {id: string; productId: string; price: number; quantity: number; sku?: string};
type RuleResultDto = {rule: string; status: string; slot_a: string; slot_b?: string | null; message?: string | null};
type CheckDto = {
  overall: string;
  results: RuleResultDto[];
  power?: {estimated_tdp_watts: number; recommended_psu_watts: number; selected_psu_watts?: number | null} | null;
};

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {Accept: "application/json", ...(init?.body ? {"Content-Type": "application/json"} : {}), ...init?.headers},
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`UPSTREAM_${response.status}`);
  const body = (await response.json()) as Envelope<T>;
  if (body.data === null || body.data === undefined) throw new Error("UPSTREAM_EMPTY");
  return body.data;
}

function pickSpecs(specs: Record<string, string | number>): Record<string, string | number> {
  return Object.fromEntries(SPEC_KEYS.filter((key) => specs[key] !== undefined).map((key) => [key, specs[key]]));
}

/**
 * Server-side handoff of a build to the assistant. A build made of real catalog variants is read back from the catalog
 * and checked by the AI service, so the question carries verified facts only; a build of sample ids (no catalog) still
 * goes through the fixtures. Never trusts prices or specs from the URL, only the variant ids.
 */
export async function resolveBuildQuestion(selection: Selection, locale: string): Promise<string> {
  const entries = Object.entries(selection).filter(([, id]) => Boolean(id)) as [Slot, string][];
  if (entries.length === 0) throw new Error("EMPTY_BUILD");
  if (!entries.some(([, id]) => UUID_REGEX.test(id))) return buildQuestion(selection, locale);

  const {BACKEND_API_URL, AI_API_URL} = getServerEnv();
  const catalog = `${BACKEND_API_URL}/catalog-service`;

  const parts = await Promise.all(
    entries.map(async ([slot, id]) => {
      if (!UUID_REGEX.test(id)) throw new Error("MIXED_BUILD");
      const variant = await getJson<VariantDto>(`${catalog}/product-variants/${id}`);
      const product = await getJson<ProductDetailDto>(`${catalog}/products/${variant.productId}`);
      const part = mapSnapshotProductToParts(product, slot).find((candidate) => candidate.id === id);
      if (!part) throw new Error("PART_NOT_FOUND");
      return part;
    }),
  );

  let check: CheckDto | null = null;
  try {
    check = await getJson<CheckDto>(`${AI_API_URL}/compatibility/check`, {
      method: "POST",
      body: JSON.stringify({slots: Object.fromEntries(entries)}),
    });
  } catch {
    // The question is still worth asking; it just says the rules could not be run.
  }

  const total = parts.reduce((sum, part) => sum + part.price, 0);
  const missing = (["CPU", "MAINBOARD", "RAM", "GPU", "SSD", "PSU", "CASE", "COOLER"] as const).filter((slot) => !selection[slot]);
  const introduction =
    locale === "en"
      ? "Evaluate this PC setup for balance, trade-offs and possible upgrades. Prices and specifications come from our live catalog and the compatibility results from our rule engine; do not invent missing specifications. Ask for my budget and usage if needed."
      : "Đánh giá góc máy này về độ cân bằng, đánh đổi và hướng nâng cấp. Giá và thông số lấy từ catalog thật, kết quả tương thích do bộ luật của hệ thống kiểm tra; không tự bịa thông số còn thiếu. Hỏi thêm ngân sách và nhu cầu nếu cần.";
  const lines = parts.map((part) => `${part.slot}: ${part.name} [${part.sku}] — ${part.price} VND; ${JSON.stringify(pickSpecs(part.specs))}`);
  const checks = check
    ? check.results
        .map((result) => `${result.rule}[${[result.slot_a, result.slot_b].filter(Boolean).join("+")}]=${result.status}${result.message ? ` (${result.message})` : ""}`)
        .join("; ")
    : "unavailable";
  const power = check?.power
    ? `\nEstimated draw: ${check.power.estimated_tdp_watts}W, recommended PSU ≥ ${check.power.recommended_psu_watts}W${
        check.power.selected_psu_watts ? `, selected PSU ${check.power.selected_psu_watts}W` : ""
      }`
    : "";
  const question = `${introduction}\n\n${lines.join("\n")}\n\nTotal: ${total} VND\nNot selected: ${missing.join(", ") || "none"}\nCompatibility checks: ${checks}${power}`;
  if (question.length > MAX_QUESTION_LENGTH) throw new Error("BUILD_CONTEXT_TOO_LONG");
  return question;
}
