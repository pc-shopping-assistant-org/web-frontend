import {z} from "zod";
import {parseRequest} from "@/lib/api/parse-request";
import {AiMode, AssistantRunStatus} from "@/lib/domain/assistant-enums";
import {ACTIVE_CONVERSATION_STORAGE_KEY, CONVERSATION_HISTORY_PAGE_SIZE, CONVERSATION_ID_PARAM} from "./constants";
import {runSchema} from "./contracts/stateful";
import {getChatResource, waitForRunResult} from "./stateful-api";
import type {ChatTurn} from "./models";
import {productCardStreamSchema} from "./contracts/stream";
import {mapProductCard} from "./mappers";

const messagePageSchema = z.object({
  items: z.array(z.object({run_id: z.uuid(), role: z.enum(["user", "assistant"]), content: z.string(), selected_product_ids: z.array(z.uuid()).default([]), products: z.array(productCardStreamSchema).default([])})),
  next_cursor: z.uuid().nullable(),
});

export function getStoredConversationId(): string | undefined {
  try {
    const raw = typeof window !== "undefined" ? window.sessionStorage.getItem(ACTIVE_CONVERSATION_STORAGE_KEY) : null;
    const parsed = z.uuid().safeParse(raw);
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export function setConversationUrl(conversationId?: string) {
  const url = new URL(window.location.href);
  if (conversationId) {
    url.searchParams.set(CONVERSATION_ID_PARAM, conversationId);
    try {
      window.sessionStorage.setItem(ACTIVE_CONVERSATION_STORAGE_KEY, conversationId);
    } catch {
      // ignore storage quota / privacy mode errors
    }
  } else {
    url.searchParams.delete(CONVERSATION_ID_PARAM);
    try {
      window.sessionStorage.removeItem(ACTIVE_CONVERSATION_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }
  for (const key of ["build", "productId", "productIds"]) url.searchParams.delete(key);
  window.history.replaceState(window.history.state, "", url);
}

export async function loadConversationHistory(conversationId: string, signal?: AbortSignal) {
  const id = parseRequest(z.uuid(), conversationId);
  const turns = new Map<string, ChatTurn>();
  let cursor: string | null = null;
  do {
    const params = new URLSearchParams({limit: String(CONVERSATION_HISTORY_PAGE_SIZE)});
    if (cursor) params.set("cursor", cursor);
    const page = messagePageSchema.parse(await getChatResource(`/conversations/${id}/messages?${params}`, signal));
    for (const message of page.items) {
      const turn = turns.get(message.run_id) ?? {runId: message.run_id, prompt: ""};
      if (message.role === "user") {
        turn.prompt = message.content;
        turn.selectedProductIds = message.selected_product_ids;
      }
      else turn.response = {conversation_id: id, intent: AiMode.Chat, answer: message.content, products: message.products.map(mapProductCard)};
      turns.set(message.run_id, turn);
    }
    cursor = page.next_cursor;
  } while (cursor);
  const history = [...turns.values()];
  const latestAnswer = history.findLast((turn) => turn.response);
  // Recover the latest cards/proposal/build from its exact published run.
  if (latestAnswer?.runId) latestAnswer.response = await waitForRunResult(id, latestAnswer.runId, signal);
  const last = history.at(-1);
  let pendingRunId: string | undefined;
  if (last?.runId && !last.response) {
    const run = runSchema.parse(await getChatResource(`/conversations/${id}/runs/${last.runId}`, signal));
    const terminal = [AssistantRunStatus.Completed, AssistantRunStatus.WaitingInput, AssistantRunStatus.FailedTerminal, AssistantRunStatus.Cancelled];
    if (run.status === AssistantRunStatus.Completed || run.status === AssistantRunStatus.WaitingInput)
      last.response = await waitForRunResult(id, last.runId, signal);
    else if (!terminal.some((status) => status === run.status)) pendingRunId = last.runId;
  }
  return {turns: history, pendingRunId};
}
