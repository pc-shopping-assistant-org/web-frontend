import {aiFetch, aiStreamFetch} from "@/lib/api/client";
import type {
  ChatDataDto,
  CompareDataDto,
  ConsultDataDto,
  EvaluateDataDto,
  SearchDataDto,
} from "@/features/assistant/contracts/dto";
import {
  mapChatData,
  mapCompareData,
  mapConsultData,
  mapEvaluateData,
  mapSearchData,
} from "@/features/assistant/mappers";
import {
  chatRequestSchema,
  compareRequestSchema,
  consultRequestSchema,
  evaluateRequestSchema,
  semanticSearchRequestSchema,
} from "@/features/assistant/contracts/requests";
import type {ChatData} from "@/features/assistant/contracts/responses";
export type {
  ChatData,
  CompareData,
  ConsultData,
  EvaluateData,
  SearchData,
} from "@/features/assistant/contracts/responses";
import {parseRequest} from "@/lib/api/parse-request";
import {ApiClientError, normalizeMessage, parseApiResponse} from "@/lib/api/envelope";
import {STATIC_MESSAGE_KEYS} from "@/lib/api/contracts/common";
import {parseSse} from "@/lib/api/sse";
import {ChatStreamEventType} from "@/lib/domain/assistant-enums";
import {chatStreamEventSchema, type ChatStreamEventDto} from "./contracts/stream";

export type ChatStreamHandlers = {
  onStart?: (conversationId: string) => void;
  onDelta?: (delta: string) => void;
  onComplete?: (data: ChatData) => void;
};

export function chat(message: string, conversationId?: string) {
  const payload = parseRequest(chatRequestSchema, {message, conversation_id: conversationId ?? null});
  return aiFetch<ChatDataDto>("/chat", {method: "POST", body: JSON.stringify(payload)}).then(mapChatData);
}

/**
 * Stream one chat turn through the AI BFF. The callback surface is feature
 * owned; callers never need to parse SSE framing or transport envelopes.
 */
export async function streamChat(
  message: string,
  conversationId?: string,
  handlers: ChatStreamHandlers = {},
  signal?: AbortSignal,
): Promise<ChatData> {
  const payload = parseRequest(chatRequestSchema, {
    message,
    conversation_id: conversationId ?? null,
  });
  const response = await aiStreamFetch("/chat/stream", {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
  const body = response.body;
  if (!body) {
    throw new ApiClientError(
      502,
      STATIC_MESSAGE_KEYS.AI_CHAT_STREAM_FAILED,
      [{code: "EMPTY_STREAM", message: "The chat stream has no body."}],
    );
  }

  let completed: ChatData | undefined;
  try {
    for await (const frame of parseSse<unknown>(body)) {
      const envelope = parseApiResponse(frame.data);
      const parsed = chatStreamEventSchema.safeParse(envelope.data);
      if (!parsed.success) {
        throw new ApiClientError(
          502,
          STATIC_MESSAGE_KEYS.AI_CHAT_STREAM_FAILED,
          [{code: "MALFORMED_STREAM_EVENT", message: "The chat stream event is invalid."}],
        );
      }
      const event: ChatStreamEventDto = parsed.data;
      if (event.event === ChatStreamEventType.Error) {
        throw new ApiClientError(
          502,
          normalizeMessage(
            envelope.message,
            STATIC_MESSAGE_KEYS.AI_CHAT_STREAM_FAILED,
          ),
          envelope.errors,
        );
      }
      const eventConversationId = event.conversation_id;
      if (!eventConversationId) {
        throw new ApiClientError(
          502,
          STATIC_MESSAGE_KEYS.AI_CHAT_STREAM_FAILED,
          [{code: "MISSING_CONVERSATION_ID", message: "The chat stream event has no conversation id."}],
        );
      }
      if (event.event === ChatStreamEventType.Start) {
        handlers.onStart?.(eventConversationId);
      } else if (event.event === ChatStreamEventType.Delta) {
        if (event.delta) handlers.onDelta?.(event.delta);
      } else if (event.result) {
        completed = mapChatData(event.result as ChatDataDto);
        handlers.onComplete?.(completed);
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    if (error instanceof ApiClientError) throw error;
    throw new ApiClientError(
      502,
      STATIC_MESSAGE_KEYS.AI_CHAT_STREAM_FAILED,
      [{code: "STREAM_READ_FAILED", message: "The chat stream could not be read."}],
    );
  }

  if (!completed) {
    throw new ApiClientError(
      502,
      STATIC_MESSAGE_KEYS.AI_CHAT_STREAM_FAILED,
      [{code: "INCOMPLETE_STREAM", message: "The chat stream ended before completion."}],
    );
  }
  return completed;
}

export function semanticSearch(query: string) {
  const payload = parseRequest(semanticSearchRequestSchema, {query});
  return aiFetch<SearchDataDto>("/search", {method: "POST", body: JSON.stringify(payload)}).then(mapSearchData);
}

export function consult(query: string) {
  const payload = parseRequest(consultRequestSchema, {query});
  return aiFetch<ConsultDataDto>("/consult", {method: "POST", body: JSON.stringify(payload)}).then(mapConsultData);
}

export function compare(productIds: string[], question?: string) {
  const payload = parseRequest(compareRequestSchema, {product_ids: productIds, question: question || null});
  return aiFetch<CompareDataDto>("/compare", {method: "POST", body: JSON.stringify(payload)}).then(mapCompareData);
}

export function evaluate(productId: string, question?: string) {
  const payload = parseRequest(evaluateRequestSchema, {product_id: productId, question: question || null});
  return aiFetch<EvaluateDataDto>("/evaluate", {method: "POST", body: JSON.stringify(payload)}).then(mapEvaluateData);
}
