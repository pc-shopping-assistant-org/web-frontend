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

export type ProposalChangeValue =
  | {kind: "TEXT"; text: string}
  | {kind: "QUANTITY"; amount: number; unit: string}
  | {kind: "REFERENCE"; variantId: string};

export type ProposalChange = {
  operation: "SET" | "CLEAR";
  target: string;
  subject?: string | null;
  predicate?: string | null;
  operator?: "EQ" | "GTE" | "LTE" | null;
  strength?: "HARD" | "SOFT" | null;
  variantId?: string | null;
  value?: ProposalChangeValue | null;
};

export type StatefulProposal = {
  proposalId: string;
  proposalHash: string;
  targetRevision: number;
  baseRequirementsHash: string;
  changes: ProposalChange[];
};

export type ChatData = {
  answer: string;
  conversation_id: string;
  intent: string;
  products: AssistantProduct[];
  stateful?: {
    revision: number;
    taskKinds?: string[];
    proposal: StatefulProposal | null;
    clarificationOptions: string[];
    build: {
      totalSpending: number;
      stale: boolean;
      parts: {slot: string; name: string; variantId: string | null; spending: number; owned: boolean; pinned: boolean}[];
    } | null;
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

export type ChatTurn = {
  runId?: string;
  prompt: string;
  selectedProductIds?: string[];
  response?: ChatData | SearchData | ConsultData | CompareData | EvaluateData;
};
