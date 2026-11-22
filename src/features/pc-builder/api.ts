import {backendFetch} from "@/lib/api/client";
import {CheckVerdict, coreSlots, optionalSlots, type PickerSort, type Selection, type Slot} from "./contracts";
import type {BuildQuote, Part} from "./models";
import {checkCandidates, checkCompatibility} from "./compatibility-api";
import type {ProductDetailDto} from "@/features/catalog/contracts/dto";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const SLOT_CATEGORY_MAP: Record<Slot, string> = {
  CPU: "01a1ac19-709a-7526-a770-4ed11b3772ed",
  MAINBOARD: "01a1ac19-709b-76c2-91cf-a7da16d9880d",
  RAM: "01a1ac19-709b-78dd-abce-e65218c62954",
  GPU: "01a1ac19-709b-795f-b826-c680ea79c371",
  PSU: "01a1ac19-709b-7b46-a896-a1378a7b4977",
  CASE: "01a1ac19-709b-7ca4-a716-181b26ea8efc",
  COOLER: "01a1ac19-709b-7d20-af45-013045962465",
  SSD: "01a1ac19-709b-7d7c-a911-284fb49b031a",
  MONITOR: "01a1ac19-709b-7dd7-93be-7c74a4a480cf",
  MOUSE: "01a1ac19-709b-7e2f-9ad7-580e5acb5817",
  KEYBOARD: "01a1ac19-709b-7e84-8fef-0f6bb5408b50",
  HEADSET: "01a1ac19-709b-7f5b-aa01-e02c9e64951a",
};

// Global cache of parts by ID (both variantId and productId)
const partCache = new Map<string, Part>();

export function registerPart(part: Part) {
  partCache.set(part.id, part);
}

export function getCachedPart(id: string): Part | undefined {
  return partCache.get(id);
}

function normalizeSpecs(raw?: Record<string, unknown> | null): Record<string, string | number> {
  if (!raw || typeof raw !== "object") return {};
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" || typeof value === "number") {
      result[key] = value;
    } else if (typeof value === "boolean") {
      result[key] = value ? "✓" : "—";
    } else if (Array.isArray(value)) {
      result[key] = value.map(String).join(", ");
    }
  }
  return result;
}

export function mapSnapshotProductToParts(prod: ProductDetailDto, slot: Slot): Part[] {
  const mainImage = prod.images?.find((img) => img.main)?.url || prod.images?.[0]?.url || undefined;
  const specs = normalizeSpecs(prod.specifications);

  if (!prod.variants || prod.variants.length === 0) {
    const part: Part = {
      id: prod.id,
      name: prod.name,
      sku: prod.seoName || prod.id.slice(0, 8).toUpperCase(),
      brand: prod.brandName || "",
      slot,
      price: 0,
      inStock: true,
      specs,
      imageUrl: mainImage,
    };
    registerPart(part);
    return [part];
  }

  return prod.variants.map((v) => {
    const optionSuffix = v.options?.length ? ` (${v.options.map((o) => o.value).join(", ")})` : "";
    const part: Part = {
      id: v.id,
      name: prod.name + optionSuffix,
      sku: v.sku || prod.seoName,
      brand: prod.brandName || "",
      slot,
      price: v.price,
      inStock: v.quantity > 0,
      specs,
      imageUrl: v.imageUrl || mainImage,
    };
    registerPart(part);
    return part;
  });
}

/** Products on one page of the part picker: five cards a row, three rows. */
export const PICKER_PAGE_SIZE = 15;

type SnapshotPageResponse = {
  items: ProductDetailDto[];
  nextCursor?: string | null;
  hasNext: boolean;
  totalElements?: number | null;
  totalPages?: number | null;
};

export type {PickerSort};
export type PickerQuery = {page: number; keyword?: string; brandId?: string; sort: PickerSort};
export type PickerPage = {parts: Part[]; totalPages: number; totalElements: number};
export type PickerBrand = {id: string; name: string};

/**
 * One page of the products for a PC slot, filtered and ordered by catalog-service itself, so a category of any size
 * pages without being loaded whole.
 */
export async function getComponentPage(slot: Slot, query: PickerQuery, signal?: AbortSignal): Promise<PickerPage> {
  const categoryId = SLOT_CATEGORY_MAP[slot];
  const params = new URLSearchParams({
    categoryId,
    limit: String(PICKER_PAGE_SIZE),
    page: String(query.page),
    sort: query.sort,
  });
  if (query.keyword?.trim()) params.set("keyword", query.keyword.trim());
  if (query.brandId) params.set("brandId", query.brandId);
  const res = await backendFetch<SnapshotPageResponse>(`/catalog-service/products/snapshot?${params}`, {signal});
  const items = Array.isArray(res?.items) ? res.items : [];
  return {
    parts: items.flatMap((prod) => mapSnapshotProductToParts(prod, slot)),
    totalPages: Math.max(1, res.totalPages ?? 1),
    totalElements: res.totalElements ?? items.length,
  };
}

/** Brands that sell in a slot's category, for the picker's brand filter. */
export async function getBrands(slot: Slot, signal?: AbortSignal): Promise<PickerBrand[]> {
  const categoryId = SLOT_CATEGORY_MAP[slot];
  const brands = await backendFetch<{id: string; name: string}[]>(`/catalog-service/brands?categoryId=${categoryId}`, {signal});
  return Array.isArray(brands) ? brands.map(({id, name}) => ({id, name})) : [];
}

/**
 * Fetch real accessory components from catalog-service.
 */
export async function getAccessories(signal?: AbortSignal): Promise<Part[]> {
  const results = await Promise.all(
    optionalSlots.map((slot) =>
      backendFetch<SnapshotPageResponse>(
        `/catalog-service/products/snapshot?categoryId=${SLOT_CATEGORY_MAP[slot]}&limit=20`,
        {signal},
      ).then((res) => (res?.items ? res.items.flatMap((p) => mapSnapshotProductToParts(p, slot)) : [])),
    ),
  );
  return results.flat();
}

/**
 * Evaluate how well each of `candidateIds` (the parts on the page being shown) fits the current selection.
 */
export async function getCandidates(
  selection: Selection,
  slot: Slot,
  candidateIds: string[],
  signal?: AbortSignal,
): Promise<Record<string, CheckVerdict>> {
  const selectedEntries = Object.entries(selection).filter(([, id]) => Boolean(id));
  const chosen: Record<string, string> = {};
  for (const [chosenSlot, id] of selectedEntries) {
    if (chosenSlot !== slot && id) chosen[chosenSlot] = id;
  }
  const verdicts =
    Object.keys(chosen).length > 0
      ? await checkCandidates(chosen, slot, candidateIds, signal)
      : {};
  return Object.fromEntries(candidateIds.map((id) => [id, verdicts[id] ?? "UNKNOWN"]));
}

/**
 * Fetch variant details if missing from memory cache
 */
async function resolvePart(slot: Slot, variantId: string): Promise<Part> {
  const cached = getCachedPart(variantId);
  if (cached) return cached;
  if (!UUID_REGEX.test(variantId)) throw new Error("INVALID_VARIANT_ID");
  type VariantRes = {
    id: string;
    productId: string;
    price: number;
    quantity: number;
    sku: string;
    imageUrl?: string | null;
  };
  const variant = await backendFetch<VariantRes>(`/catalog-service/product-variants/${variantId}`);
  const product = await backendFetch<ProductDetailDto>(`/catalog-service/products/${variant.productId}`);
  const parts = mapSnapshotProductToParts(product, slot);
  const part = parts.find((candidate) => candidate.id === variantId);
  if (!part) throw new Error("VARIANT_NOT_FOUND");
  return part;
}

/**
 * Generates quote for build selection and executes compatibility checks.
 */
export async function getQuote(selection: Selection, signal?: AbortSignal): Promise<BuildQuote> {
  const selectedEntries = Object.entries(selection).filter(([, id]) => Boolean(id)) as [Slot, string][];
  const resolvedParts = await Promise.all(selectedEntries.map(([slot, id]) => resolvePart(slot, id)));

  const total = resolvedParts.reduce((sum, p) => sum + p.price, 0);
  const missing = coreSlots.filter((slot) => !selection[slot]);

  // Execute backend compatibility check
  const slotsPayload: Record<string, string> = {};
  for (const [slot, id] of selectedEntries) {
    slotsPayload[slot] = id;
  }

  let checks: BuildQuote["checks"] = [];
  let power: BuildQuote["power"];
  if (Object.keys(slotsPayload).length > 0) {
    const compatRes = await checkCompatibility(slotsPayload, signal);
    power = compatRes.power;
    checks = compatRes.results.map((r) => ({
      code: r.rule,
      status: (r.status === "OK" ? "COMPATIBLE" : r.status === "INCOMPATIBLE" ? "INCOMPATIBLE" : "UNKNOWN") as
        | "COMPATIBLE"
        | "INCOMPATIBLE"
        | "UNKNOWN",
      slots: [r.slotA as Slot, r.slotB as Slot].filter(Boolean),
      message: r.message ?? undefined,
    }));
  }

  return {total, parts: resolvedParts, missing, checks, power};
}
