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
  Status = "STATUS",
  Completed = "COMPLETED",
  Error = "ERROR",
}

export enum AgentActivityStage {
  Thinking = "THINKING",
  SearchingCatalog = "SEARCHING_CATALOG",
  LoadingDetails = "LOADING_DETAILS",
  Comparing = "COMPARING",
  CheckingCompatibility = "CHECKING_COMPATIBILITY",
  BuildingPc = "BUILDING_PC",
  SearchingWeb = "SEARCHING_WEB",
  Verifying = "VERIFYING",
}

export enum AssistantFailureReason {
  ModelTimeout = "MODEL_TIMEOUT",
  ModelUnavailable = "MODEL_UNAVAILABLE",
  ProcessingFailed = "PROCESSING_FAILED",
}

export enum AssistantRunStatus {
  Pending = "PENDING",
  Running = "RUNNING",
  Recovering = "RECOVERING",
  WaitingInput = "WAITING_INPUT",
  Completed = "COMPLETED",
  FailedRetryable = "FAILED_RETRYABLE",
  FailedTerminal = "FAILED_TERMINAL",
  Cancelled = "CANCELLED",
}

export enum FlexibleTurnStatus {
  Completed = "COMPLETED",
  Unresolved = "UNRESOLVED",
  WaitingInput = "WAITING_INPUT",
  Discarded = "DISCARDED",
}

export enum AssistantTaskKind {
  Build = "BUILD",
  Compare = "COMPARE",
  Answer = "ANSWER",
  ExplainSavedBuild = "EXPLAIN_SAVED_BUILD",
}

export enum ThinkingMode {
  Off = "off",
  Minimal = "minimal",
  Low = "low",
  Medium = "medium",
  High = "high",
  On = "on",
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
