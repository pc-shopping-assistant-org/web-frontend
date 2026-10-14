import type {CategoryTree} from "@/features/catalog/contracts/responses";

/** The category tree as a flat list for a select, with a dash per level of depth. */
export function flattenCategories(categories: CategoryTree[], depth = 0): {id: string; label: string}[] {
  return categories.flatMap((category) => [
    ...(category.id ? [{id: category.id, label: `${"— ".repeat(depth)}${category.name ?? ""}`}] : []),
    ...flattenCategories(category.children ?? [], depth + 1),
  ]);
}

/** A filter box's text as a number; empty or not a number means "no filter". */
export function toNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
