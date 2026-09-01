import {enumValues} from "@/lib/domain/enum-values";

export enum AiMode {
  Chat = "CHAT",
  Search = "SEARCH",
  Consult = "CONSULT",
  Compare = "COMPARE",
  Evaluate = "EVALUATE",
}

export enum AnalyticsPeriod {
  Week = "WEEK",
  Month = "MONTH",
  Year = "YEAR",
}

export const AI_MODE_VALUES = enumValues(AiMode);
export const ANALYTICS_PERIOD_VALUES = enumValues(AnalyticsPeriod);
