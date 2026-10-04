import type {ComponentDto, QuoteDto} from "./contracts";
import type {BuildQuote, Part} from "./models";

export function toPart(dto: ComponentDto): Part {
  return {id: dto.id, name: dto.name, sku: dto.sku, brand: dto.brand, slot: dto.slot, price: dto.listPrice, inStock: dto.quantity > 0, specs: dto.specifications};
}
export function toQuote(dto: QuoteDto): BuildQuote {
  return {total: dto.total, parts: dto.items.map(toPart), missing: dto.missingSlots, checks: dto.checks};
}
