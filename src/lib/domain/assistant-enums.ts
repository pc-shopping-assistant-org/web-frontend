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

export enum FlexibleTurnStatus {
  Completed = "COMPLETED",
  Unresolved = "UNRESOLVED",
  WaitingInput = "WAITING_INPUT",
  Discarded = "DISCARDED",
}

export enum RequirementOperation {
  Set = "SET",
  Clear = "CLEAR",
}

export enum RequirementValueKind {
  Text = "TEXT",
  Quantity = "QUANTITY",
  Reference = "REFERENCE",
}

export const AI_MODE_VALUES = enumValues(AiMode);
export const CHAT_STREAM_EVENT_VALUES = enumValues(ChatStreamEventType);
