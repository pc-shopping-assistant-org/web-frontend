import type {CategoryTree, HardwareType} from "./models";

/** The name of a hardware type of the master table in the language the page is shown in. */
export function hardwareTypeName(type: HardwareType, locale: string) {
  return locale === "vi" ? type.nameVi : type.nameEn;
}

/** code -> name in the page language, to label whatever carries a hardware type code (a category, a product). */
export function hardwareTypeNames(types: readonly HardwareType[] | undefined, locale: string) {
  return new Map((types ?? []).map((type) => [type.code, hardwareTypeName(type, locale)]));
}

/**
 * A category named like its hardware type in Vietnamese ("Card đồ họa" for GPU) takes the type's name in the page language,
 * so the storefront shows "Graphics card" in English. A category with a name of its own ("Ổ cứng SSD") keeps it.
 */
export function localizedCategoryName(category: Pick<CategoryTree, "name" | "hardwareType">, types: readonly HardwareType[] | undefined, locale: string) {
  if (locale === "vi" || !category.hardwareType) return category.name;
  const type = types?.find((candidate) => candidate.code === category.hardwareType);
  return type && category.name.trim().toLowerCase() === type.nameVi.trim().toLowerCase() ? hardwareTypeName(type, locale) : category.name;
}

export function localizeCategoryNames(tree: CategoryTree[], types: readonly HardwareType[] | undefined, locale: string): CategoryTree[] {
  if (locale === "vi" || !types?.length) return tree;
  const localize = (nodes: CategoryTree[]): CategoryTree[] =>
    nodes.map((node) => ({...node, name: localizedCategoryName(node, types, locale), children: localize(node.children)}));
  return localize(tree);
}
