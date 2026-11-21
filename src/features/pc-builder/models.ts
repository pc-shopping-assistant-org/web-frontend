import type {Slot} from "./contracts";

export type Part = {
  id: string;
  name: string;
  sku: string;
  brand: string;
  slot: Slot;
  price: number;
  inStock: boolean;
  specs: Record<string, string | number>;
  imageUrl?: string;
};
export type BuildQuote = {
  total: number;
  parts: Part[];
  missing: Slot[];
  checks: {code: string; status: "COMPATIBLE" | "INCOMPATIBLE" | "UNKNOWN"; slots: Slot[]; message?: string}[];
  /** Estimated draw of the build and the supply it calls for, from the AI service; absent until there is a CPU or GPU. */
  power?: {
    estimatedWatts: number;
    recommendedPsuWatts: number;
    psuWatts: number | null;
    sufficient: boolean | null;
  } | null;
};
