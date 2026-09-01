import {aiFetch} from "@/lib/api/client";
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
export type {
  ChatData,
  CompareData,
  ConsultData,
  EvaluateData,
  SearchData,
} from "@/features/assistant/contracts/responses";
import {parseRequest} from "@/lib/api/parse-request";

export function chat(message: string, conversationId?: string) {
  const payload = parseRequest(chatRequestSchema, {message, conversation_id: conversationId ?? null});
  return aiFetch<ChatDataDto>("/chat", {method: "POST", body: JSON.stringify(payload)}).then(mapChatData);
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
