import {aiFetch, aiStreamFetch} from "@/lib/api/client";
import {ApiClientError, parseApiResponse} from "@/lib/api/envelope";
import {STATIC_MESSAGE_KEYS} from "@/lib/api/contracts/common";
import type {AiSchema} from "@/lib/api/generated/types";
import {parseSse} from "@/lib/api/sse";
import {parseRequest} from "@/lib/api/parse-request";
import {ChatStreamEventType} from "@/lib/domain/assistant-enums";
import {STATEFUL_SCHEMA_VERSION} from "./constants";
import type {ChatData} from "./models";
import {mapStatefulTurn} from "./mappers";
import type {ChatStreamHandlers} from "./api";
import {conversationSchema, runSchema, statefulEventSchema, turnRequestSchema, type Confirmation} from "./contracts/stateful";

export type ChatTurnOptions = {selectedProductIds?: string[]; confirmation?: Confirmation};

const invalidStream = () =>
  new ApiClientError(502, STATIC_MESSAGE_KEYS.AI_CHAT_STREAM_FAILED, [
    {code: "INCOMPLETE_OR_INVALID_STREAM", message: "Reload the conversation to read the run result."},
  ]);

/** One admission and one stream. Disconnect does not retry/resubmit/cancel the run. */
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
      conversationId ? {signal} : {method: "POST", body: "{}", signal},
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
  const response = await aiStreamFetch(`/conversations/${conversation.conversation_id}/runs/${run.run_id}/events`, {signal});
  let sequence = 0;
  for await (const frame of parseSse<unknown>(response.body!)) {
    const envelope = parseApiResponse(frame.data);
    if (envelope.data === null) throw invalidStream();
    const parsed = statefulEventSchema.safeParse(envelope.data);
    if (!parsed.success) throw invalidStream();
    const event = parsed.data;
    if (event.conversation_id !== conversation.conversation_id || event.run_id !== run.run_id || event.sequence !== sequence + 1)
      throw invalidStream();
    sequence = event.sequence;
    if (event.event === ChatStreamEventType.Error)
      throw new ApiClientError(502, STATIC_MESSAGE_KEYS.AI_CHAT_STREAM_FAILED, envelope.errors);
    if (event.event === ChatStreamEventType.Delta) handlers.onDelta?.(event.delta);
    if (event.event === ChatStreamEventType.Completed) {
      if (
        event.result.run.run_id !== run.run_id ||
        event.result.run.conversation_id !== conversation.conversation_id ||
        event.result.revision !== conversation.revision + 1
      )
        throw invalidStream();
      const result = mapStatefulTurn(event.result);
      handlers.onComplete?.(result);
      return result;
    }
  }
  throw invalidStream();
}
