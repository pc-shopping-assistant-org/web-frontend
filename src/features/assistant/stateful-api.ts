import {aiFetch, aiStreamFetch} from "@/lib/api/client";
import {ApiClientError, parseApiResponse} from "@/lib/api/envelope";
import {STATIC_MESSAGE_KEYS} from "@/lib/api/contracts/common";
import type {AiSchema} from "@/lib/api/generated/types";
import {parseSse} from "@/lib/api/sse";
import {parseRequest} from "@/lib/api/parse-request";
import {ChatStreamEventType} from "@/lib/domain/assistant-enums";
import {RUN_RESULT_POLL_INTERVAL_MS, STATEFUL_SCHEMA_VERSION} from "./constants";
import type {ChatData} from "./models";
import {mapStatefulTurn} from "./mappers";
import type {ChatStreamHandlers} from "./api";
import {conversationSchema, runSchema, statefulEventSchema, turnRequestSchema, type Confirmation, type StatefulTurnResult} from "./contracts/stateful";

export type ChatTurnOptions = {selectedProductIds?: string[]; confirmation?: Confirmation};

const invalidStream = () =>
  new ApiClientError(502, STATIC_MESSAGE_KEYS.AI_CHAT_STREAM_FAILED, [
    {code: "INCOMPLETE_OR_INVALID_STREAM", message: "Reload the conversation to read the run result."},
  ]);

/** One admission and one stream. A lost stream waits for the same durable run. */
export async function streamChat(
  message: string,
  conversationId?: string,
  handlers: ChatStreamHandlers = {},
  signal?: AbortSignal,
  options: ChatTurnOptions = {},
): Promise<ChatData> {
  const conversation = conversationSchema.parse(
    await aiFetch<AiSchema["ConversationViewV2"]>(
      conversationId ? `/conversations/${conversationId}` : "/conversations",
      conversationId ? {signal, cache: "no-store"} : {method: "POST", body: "{}", signal},
    ),
  );
  handlers.onStart?.(conversation.conversation_id);
  const payload = parseRequest(turnRequestSchema, {
    schema_version: STATEFUL_SCHEMA_VERSION,
    conversation_id: conversation.conversation_id,
    request_id: crypto.randomUUID(),
    expected_revision: conversation.revision,
    message,
    ...(options.selectedProductIds?.length ? {selected_product_ids: options.selectedProductIds} : {}),
    ...(options.confirmation ? {confirmation: options.confirmation} : {}),
  }) satisfies AiSchema["TurnRequestV2Body"];
  const run = runSchema.parse(
    await aiFetch<AiSchema["RunViewV1"]>(`/conversations/${conversation.conversation_id}/runs`, {
      method: "POST",
      body: JSON.stringify(payload),
      signal,
    }),
  );
  if (
    run.conversation_id !== conversation.conversation_id ||
    run.request_id !== payload.request_id ||
    run.base_revision !== conversation.revision
  )
    throw invalidStream();
  const path = `/conversations/${conversation.conversation_id}/runs/${run.run_id}`;
  let completed: StatefulTurnResult;
  try {
    completed = await readStream(path, run.run_id, conversation.conversation_id, handlers, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    // A terminal ERROR is execution failure, not a transport interruption.
    if (error instanceof ApiClientError && error.messageKey === STATIC_MESSAGE_KEYS.AI_RUN_FAILED) throw error;
    completed = await readSavedResult(path, run.run_id, conversation.conversation_id, signal);
  }
  if (
    completed.run.run_id !== run.run_id || completed.run.conversation_id !== conversation.conversation_id ||
    completed.run.request_id !== run.request_id || completed.run.base_revision !== run.base_revision ||
    completed.revision !== conversation.revision + 1
  ) throw invalidStream();
  const result = mapStatefulTurn(completed);
  handlers.onComplete?.(result);
  return result;
}

async function readStream(
  path: string, runId: string, conversationId: string, handlers: ChatStreamHandlers, signal?: AbortSignal,
): Promise<StatefulTurnResult> {
  const response = await aiStreamFetch(`${path}/events`, {signal});
  let sequence = 0;
  for await (const frame of parseSse<unknown>(response.body!)) {
    const envelope = parseApiResponse(frame.data);
    if (envelope.data === null) throw invalidStream();
    const parsed = statefulEventSchema.safeParse(envelope.data);
    if (!parsed.success) throw invalidStream();
    const event = parsed.data;
    if (event.conversation_id !== conversationId || event.run_id !== runId || event.sequence !== sequence + 1)
      throw invalidStream();
    sequence = event.sequence;
    if (event.event === ChatStreamEventType.Error)
      throw new ApiClientError(502, STATIC_MESSAGE_KEYS.AI_RUN_FAILED, envelope.errors);
    if (event.event === ChatStreamEventType.Delta) handlers.onDelta?.(event.delta);
    if (event.event === ChatStreamEventType.Completed) return event.result;
  }
  throw invalidStream();
}

async function readSavedResult(path: string, runId: string, conversationId: string, signal?: AbortSignal): Promise<StatefulTurnResult> {
  while (true) {
    signal?.throwIfAborted();
    const data = await aiFetch<unknown>(`${path}/result`, {signal, cache: "no-store"});
    if (data !== null) {
      const event = statefulEventSchema.parse(data);
      if (event.conversation_id !== conversationId || event.run_id !== runId) throw invalidStream();
      if (event.event === ChatStreamEventType.Completed) return event.result;
      if (event.event === ChatStreamEventType.Error) throw new ApiClientError(502, STATIC_MESSAGE_KEYS.AI_RUN_FAILED);
      throw invalidStream();
    }
    await new Promise<void>((resolve, reject) => {
      const abort = () => {clearTimeout(timer); reject(signal?.reason);};
      const timer = setTimeout(() => {signal?.removeEventListener("abort", abort); resolve();}, RUN_RESULT_POLL_INTERVAL_MS);
      signal?.addEventListener("abort", abort, {once: true});
    });
  }
}

/** Resume delivery only; never submit a new turn or open another SSE. */
export async function waitForRunResult(conversationId: string, runId: string, signal?: AbortSignal): Promise<ChatData> {
  const result = await readSavedResult(`/conversations/${conversationId}/runs/${runId}`, runId, conversationId, signal);
  if (result.run.run_id !== runId || result.run.conversation_id !== conversationId || result.revision !== result.run.base_revision + 1)
    throw invalidStream();
  return mapStatefulTurn(result);
}
