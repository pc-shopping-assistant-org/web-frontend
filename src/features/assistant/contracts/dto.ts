import type {AiSchema} from "@/lib/api/generated/types";

/** AI transport shapes kept inside the assistant adapter. */
export type ChatDataDto = AiSchema["ChatData"];
export type SearchDataDto = AiSchema["SearchData"];
export type ConsultDataDto = AiSchema["ConsultData"];
export type CompareDataDto = AiSchema["CompareData"];
export type EvaluateDataDto = AiSchema["EvaluateData"];
export type ProductCardDto = AiSchema["ProductCard"];
export type ProductComparisonDto = AiSchema["ProductComparison"];
