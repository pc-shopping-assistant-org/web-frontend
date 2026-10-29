import {describe, expect, it} from "vitest";

import {getCatalogCategoryIcon} from "./components/catalog-category-icon";
import {hardwareTypeName, hardwareTypeNames, localizeCategoryNames} from "./hardware-types";
import type {CategoryTree, HardwareType} from "./models";

const gpu: HardwareType = {id: "1", code: "GPU", nameVi: "Card đồ họa", nameEn: "Graphics card", displayOrder: 40};
const other: HardwareType = {id: "2", code: "OTHER", nameVi: "Khác", nameEn: "Other", displayOrder: 999};

describe("hardware type names", () => {
  it("shows the Vietnamese name for vi and the English name for any other language", () => {
    expect(hardwareTypeName(gpu, "vi")).toBe("Card đồ họa");
    expect(hardwareTypeName(gpu, "en")).toBe("Graphics card");
  });

  it("maps a code to its name in the page language", () => {
    const names = hardwareTypeNames([gpu, other], "en");
    expect(names.get("GPU")).toBe("Graphics card");
    expect(names.get("OTHER")).toBe("Other");
    expect(names.get("MISSING")).toBeUndefined();
    expect(hardwareTypeNames(undefined, "vi").size).toBe(0);
  });
});

describe("category icon", () => {
  it("follows the hardware type code, whatever language the category name is in", () => {
    expect(getCatalogCategoryIcon("Card đồ họa", "CPU")).toBe(getCatalogCategoryIcon("cpu"));
    expect(getCatalogCategoryIcon("Tên lạ", "MOUSE")).toBe(getCatalogCategoryIcon("chuột"));
  });

  it("falls back to the name when the code is missing or unknown", () => {
    expect(getCatalogCategoryIcon("Chuột", null)).toBe(getCatalogCategoryIcon("chuột"));
    expect(getCatalogCategoryIcon("Chuột", "OTHER")).toBe(getCatalogCategoryIcon("chuột"));
  });
});

describe("localized category names", () => {
  const storage: HardwareType = {id: "3", code: "STORAGE", nameVi: "Ổ cứng", nameEn: "Storage", displayOrder: 80};
  const node = (name: string, hardwareType: string | undefined, children: CategoryTree[] = []): CategoryTree => ({
    id: name,
    name,
    hardwareType,
    children,
  });
  const tree = [node("Card đồ họa", "GPU"), node("Ổ cứng", "STORAGE", [node("Ổ cứng SSD", "STORAGE")]), node("Phụ kiện", undefined)];

  it("takes the English name of the master table for a category named like its type", () => {
    const names = localizeCategoryNames(tree, [gpu, storage], "en");
    expect(names[0].name).toBe("Graphics card");
    expect(names[1].name).toBe("Storage");
  });

  it("keeps a name of its own, in the children too, and a category without a type", () => {
    const names = localizeCategoryNames(tree, [gpu, storage], "en");
    expect(names[1].children[0].name).toBe("Ổ cứng SSD");
    expect(names[2].name).toBe("Phụ kiện");
  });

  it("leaves the Vietnamese page and a not yet loaded master table as they are", () => {
    expect(localizeCategoryNames(tree, [gpu, storage], "vi")).toBe(tree);
    expect(localizeCategoryNames(tree, undefined, "en")).toBe(tree);
  });
});
