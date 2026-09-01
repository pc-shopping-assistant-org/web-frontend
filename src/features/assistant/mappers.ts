import type {
  ChatDataDto,
  CompareDataDto,
  ConsultDataDto,
  EvaluateDataDto,
  ProductCardDto,
  ProductComparisonDto,
  SearchDataDto,
} from "@/features/assistant/contracts/dto";
import type {
  AssistantProduct,
  ChatData,
  CompareData,
  ConsultData,
  EvaluateData,
  SearchData,
} from "@/features/assistant/models";

const text = (value?: string | null) => value?.trim() ?? "";
const number = (value?: number | null) => value ?? 0;

export function mapProductCard(dto: ProductCardDto): AssistantProduct {
  return {
    id: text(dto.id),
    name: text(dto.name),
    seo_name: text(dto.seo_name),
    image_url: text(dto.image_url),
    description: text(dto.description),
    list_price: number(dto.list_price),
    specifications: dto.specifications ?? {},
    status: text(dto.status),
  };
}

export function mapProductComparison(dto: ProductComparisonDto): AssistantProduct {
  return {
    product_id: text(dto.product_id),
    name: text(dto.name),
    image_url: text(dto.image_url),
    description: text(dto.description),
    list_price: number(dto.list_price),
    specifications: dto.specifications ?? {},
    status: text(dto.status),
  };
}

export function mapChatData(dto: ChatDataDto): ChatData {
  return {
    answer: text(dto.answer),
    conversation_id: text(dto.conversation_id),
    intent: text(dto.intent),
    products: (dto.products ?? []).map(mapProductCard),
  };
}

export function mapSearchData(dto: SearchDataDto): SearchData {
  return {query: text(dto.query), products: (dto.products ?? []).map(mapProductCard)};
}

export function mapConsultData(dto: ConsultDataDto): ConsultData {
  return {
    answer: text(dto.answer),
    query: text(dto.query),
    products: (dto.products ?? []).map(mapProductCard),
  };
}

export function mapCompareData(dto: CompareDataDto): CompareData {
  return {
    answer: text(dto.answer),
    products: (dto.products ?? []).map(mapProductComparison),
  };
}

export function mapEvaluateData(dto: EvaluateDataDto): EvaluateData {
  return {answer: text(dto.answer), product: mapProductCard(dto.product)};
}
