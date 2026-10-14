/** Frontend-owned assistant models. AI wire fields stay isolated in the adapter. */
export type AssistantProduct = {
  id?: string;
  product_id?: string;
  name: string;
  seo_name?: string;
  image_url?: string;
  description?: string;
  list_price?: number;
  specifications: Record<string, unknown>;
  status?: string;
};

export type ChatData = {
  answer: string;
  conversation_id: string;
  intent: string;
  products: AssistantProduct[];
  stateful?: {
    revision: number;
    proposal: {proposalId: string; proposalHash: string; targetRevision: number; baseRequirementsHash: string; changes: string[]} | null;
    clarificationOptions: string[];
    build: {totalSpending: number; stale: boolean; parts: {slot: string; name: string; variantId: string | null; spending: number; owned: boolean; pinned: boolean}[]} | null;
  };
};

export type SearchData = {
  query: string;
  products: AssistantProduct[];
};

export type ConsultData = {
  answer: string;
  query: string;
  products: AssistantProduct[];
};

export type CompareData = {
  answer: string;
  products: AssistantProduct[];
};

export type EvaluateData = {
  answer: string;
  product: AssistantProduct;
};
