import {z} from "zod";
import {aiFetch} from "@/lib/api/client";
import {parseRequest} from "@/lib/api/parse-request";
import {AiMode, AssistantRunStatus} from "@/lib/domain/assistant-enums";
import {CONVERSATION_HISTORY_PAGE_SIZE, CONVERSATION_ID_PARAM} from "./constants";
import {runSchema} from "./contracts/stateful";
import {waitForRunResult} from "./stateful-api";
import type {ChatTurn} from "./models";

const messagePageSchema = z.object({
  items: z.array(z.object({run_id: z.uuid(), role: z.enum(["user", "assistant"]), content: z.string()})),
  next_cursor: z.uuid().nullable(),
});

export function setConversationUrl(conversationId?: string) {
  const url = new URL(window.location.href);
  if (conversationId) url.searchParams.set(CONVERSATION_ID_PARAM, conversationId);
  else url.searchParams.delete(CONVERSATION_ID_PARAM);
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
    const page = messagePageSchema.parse(await aiFetch(`/conversations/${id}/messages?${params}`, {signal, cache: "no-store"}));
    for (const message of page.items) {
      const turn = turns.get(message.run_id) ?? {runId: message.run_id, prompt: ""};
      if (message.role === "user") turn.prompt = message.content;
      else turn.response = {conversation_id: id, intent: AiMode.Chat, answer: message.content, products: []};
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
    const run = runSchema.parse(await aiFetch(`/conversations/${id}/runs/${last.runId}`, {signal, cache: "no-store"}));
    const terminal = [AssistantRunStatus.Completed, AssistantRunStatus.WaitingInput, AssistantRunStatus.FailedTerminal, AssistantRunStatus.Cancelled];
    if (run.status === AssistantRunStatus.Completed || run.status === AssistantRunStatus.WaitingInput)
      last.response = await waitForRunResult(id, last.runId, signal);
    else if (!terminal.some((status) => status === run.status)) pendingRunId = last.runId;
  }
  return {turns: history, pendingRunId};
}
