import type {Slot} from "./contracts";

export type Part = {
  id: string; name: string; sku: string; brand: string; slot: Slot;
  price: number; inStock: boolean; specs: Record<string, string | number>;
};
export type BuildQuote = {
  total: number; parts: Part[]; missing: Slot[];
  checks: {code: string; status: "COMPATIBLE" | "INCOMPATIBLE" | "UNKNOWN"; slots: Slot[]}[];
};
