import {aiFetch} from "@/lib/api/client";
import type {AiSchema} from "@/lib/api/types";

export type ChatData = AiSchema["ChatData"];
export type SearchData = AiSchema["SearchData"];
export type ConsultData = AiSchema["ConsultData"];
export type CompareData = AiSchema["CompareData"];
export type EvaluateData = AiSchema["EvaluateData"];

export function chat(message: string, conversationId?: string) {
  return aiFetch<ChatData>("/chat", {method: "POST", body: JSON.stringify({message, conversation_id: conversationId ?? null})});
}

export function semanticSearch(query: string) {
  return aiFetch<SearchData>("/search", {method: "POST", body: JSON.stringify({query, limit: 10})});
}

export function consult(query: string) {
  return aiFetch<ConsultData>("/consult", {method: "POST", body: JSON.stringify({query, limit: 5})});
}

export function compare(productIds: string[], question?: string) {
  return aiFetch<CompareData>("/compare", {method: "POST", body: JSON.stringify({product_ids: productIds, question: question || null})});
}

export function evaluate(productId: string, question?: string) {
  return aiFetch<EvaluateData>("/evaluate", {method: "POST", body: JSON.stringify({product_id: productId, question: question || null})});
}
