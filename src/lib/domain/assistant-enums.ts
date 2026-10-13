import {enumValues} from "@/lib/domain/enum-values";

export enum AiMode {
  Chat = "CHAT",
  Search = "SEARCH",
  Consult = "CONSULT",
  Compare = "COMPARE",
  Evaluate = "EVALUATE",
}

export enum ChatStreamEventType {
  Start = "START",
  Delta = "DELTA",
  Completed = "COMPLETED",
  Error = "ERROR",
}

export const AI_MODE_VALUES = enumValues(AiMode);
export const CHAT_STREAM_EVENT_VALUES = enumValues(ChatStreamEventType);
