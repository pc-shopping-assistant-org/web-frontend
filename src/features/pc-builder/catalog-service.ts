import {getServerEnv} from "@/lib/config/env";
import {optionalSlots, type ComponentDto, type Slot} from "./contracts";
import {components as fallbackFixtures} from "./fixtures";

/**
 * Category IDs for hardware types in the seed database.
 * Each slot maps to a category whose hardwareType matches the slot.
 */
export const SLOT_CATEGORY_MAP: Record<Slot, string> = {
  CPU: "01a1ac19-709a-7526-a770-4ed11b3772ed",
  MAINBOARD: "01a1ac19-709b-76c2-91cf-a7da16d9880d",
  RAM: "01a1ac19-709b-78dd-abce-e65218c62954",
  GPU: "01a1ac19-709b-795f-b826-c680ea79c371",
  PSU: "01a1ac19-709b-7b46-a896-a1378a7b4977",
  CASE: "01a1ac19-709b-7ca4-a716-181b26ea8efc",
  COOLER: "01a1ac19-709b-7d20-af45-013045962465",
  SSD: "01a119fe-8dd1-72c0-bd03-7683fbd7240e",
  MONITOR: "01a1ac19-709b-7dd7-93be-7c74a4a480cf",
  MOUSE: "01a1ac19-709b-7e2f-9ad7-580e5acb5817",
  KEYBOARD: "01a1ac19-709b-7e84-8fef-0f6bb5408b50",
  HEADSET: "01a1ac19-709b-7f5b-aa01-e02c9e64951a",
};

// In-memory cache of live catalog components mapped to ComponentDto
const catalogCache = new Map<string, ComponentDto>();

export function registerComponent(comp: ComponentDto) {
  catalogCache.set(comp.id, comp);
  catalogCache.set(comp.productId, comp);
}

export function getComponentById(id: string, slot?: Slot): ComponentDto | undefined {
  const fromCache = catalogCache.get(id);
  if (fromCache && (!slot || fromCache.slot === slot)) return fromCache;
  return fallbackFixtures.find((p) => p.id === id && (!slot || p.slot === slot));
}

export function getAllComponentsForSlot(slot: Slot): ComponentDto[] {
  const cached = Array.from(catalogCache.values()).filter((p) => p.slot === slot);
  if (cached.length > 0) return cached;
  return fallbackFixtures.filter((p) => p.slot === slot);
}

function normalizeSpecs(raw?: Record<string, unknown> | null): Record<string, string | number> {
  if (!raw || typeof raw !== "object") return {};
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" || typeof value === "number") {
      result[key] = value;
    } else if (typeof value === "boolean") {
      result[key] = value ? "Có" : "Không";
    } else if (Array.isArray(value)) {
      result[key] = value.map(String).join(", ");
    }
  }
  return result;
}

type BackendProductSnapshot = {
  id: string;
  name: string;
  seoName: string;
  brandName?: string | null;
  categoryId?: string | null;
  hardwareType?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  totalQuantity?: number | null;
  specifications?: Record<string, unknown> | null;
  variants?: Array<{
    id: string;
    productId: string;
    price: number;
    quantity: number;
    sku: string;
    imageUrl?: string | null;
  }> | null;
};

function mapBackendProductToComponent(product: BackendProductSnapshot, slot: Slot): ComponentDto {
  const variant = product.variants?.[0];
  const variantId = variant?.id || product.id;
  const comp: ComponentDto = {
    id: variantId,
    productId: product.id,
    sku: variant?.sku || product.seoName || variantId.slice(0, 8).toUpperCase(),
    name: product.name,
    slot,
    brand: product.brandName || "Chính hãng",
    listPrice: Math.round(variant?.price ?? product.minPrice ?? 0),
    quantity: variant?.quantity ?? product.totalQuantity ?? 50,
    specifications: normalizeSpecs(product.specifications),
  };
  registerComponent(comp);
  return comp;
}

export async function fetchProductsForSlot(slot: Slot): Promise<ComponentDto[]> {
  const categoryId = SLOT_CATEGORY_MAP[slot];
  if (!categoryId) {
    return fallbackFixtures.filter((p) => p.slot === slot);
  }

  try {
    const baseUrl = getServerEnv().BACKEND_API_URL;
    const res = await fetch(`${baseUrl}/catalog-service/products/snapshot?categoryId=${categoryId}&limit=50`, {
      headers: {Accept: "application/json"},
      next: {revalidate: 60},
    });

    if (!res.ok) {
      return fallbackFixtures.filter((p) => p.slot === slot);
    }

    const json = await res.json();
    const items: BackendProductSnapshot[] = json?.data?.items ?? [];

    if (!items.length) {
      return fallbackFixtures.filter((p) => p.slot === slot);
    }

    return items.map((product) => mapBackendProductToComponent(product, slot));
  } catch {
    return fallbackFixtures.filter((p) => p.slot === slot);
  }
}

export async function fetchAccessoriesFromCatalog(): Promise<ComponentDto[]> {
  try {
    const results = await Promise.all(optionalSlots.map((slot) => fetchProductsForSlot(slot)));
    const all = results.flat().filter((p) => p.quantity > 0);
    return all.length ? all : fallbackFixtures.filter((p) => optionalSlots.includes(p.slot) && p.quantity > 0);
  } catch {
    return fallbackFixtures.filter((p) => optionalSlots.includes(p.slot) && p.quantity > 0);
  }
}
