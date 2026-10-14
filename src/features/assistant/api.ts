import {aiFetch} from "@/lib/api/client";
import {streamChat} from "./stateful-api";
export {streamChat} from "./stateful-api";
import type {
  CompareDataDto,
  ConsultDataDto,
  EvaluateDataDto,
  SearchDataDto,
} from "@/features/assistant/contracts/dto";
import {
  mapCompareData,
  mapConsultData,
  mapEvaluateData,
  mapSearchData,
} from "@/features/assistant/mappers";
import {
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

export type ChatStreamHandlers = {
  onStart?: (conversationId: string) => void;
  onDelta?: (delta: string) => void;
  onComplete?: (data: ChatData) => void;
};

export function chat(message: string, conversationId?: string) {
  return streamChat(message, conversationId);
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
