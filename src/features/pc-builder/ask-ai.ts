import type {Selection} from "./contracts";
import {quoteBuild} from "./service";

/** Server-side handoff: URL selections, never client-submitted prices/specs. */
export function buildQuestion(selection: Selection, locale: string): string {
  const quote = quoteBuild(selection);
  if (!quote.items.length) throw new Error("EMPTY_BUILD");
  const introduction = locale === "en"
    ? "Evaluate this PC setup for balance, trade-offs and possible upgrades. DEMO fixtures only: prices/stock/specs are synthetic, not verified live catalog facts. Do not certify compatibility or invent missing specifications; ask for my budget and usage if needed."
    : "Đánh giá góc máy này về độ cân bằng, đánh đổi và hướng nâng cấp. Đây là dữ liệu DEMO: giá/tồn kho/thông số giả lập, không phải dữ liệu catalog thật đã xác minh. Không khẳng định tương thích hoặc tự bịa thông số còn thiếu; hỏi thêm ngân sách và nhu cầu nếu cần.";
  const parts = quote.items.map(part => `${part.slot}: ${part.name} [${part.sku}] — ${part.listPrice} VND; ${JSON.stringify(part.specifications)}`).join("\n");
  const question = `${introduction}\n\n${parts}\n\nTotal: ${quote.total} VND\nNot selected: ${quote.missingSlots.join(", ")}\nPreliminary checks: ${quote.checks.map(check => `${check.code}=${check.status}`).join("; ")}`;
  if (question.length > 4000) throw new Error("BUILD_CONTEXT_TOO_LONG");
  return question;
}
