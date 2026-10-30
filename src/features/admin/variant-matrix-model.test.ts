import {describe, expect, it} from "vitest";

import type {ProductVariant} from "@/features/catalog/contracts/responses";

import {
  buildVariationItems,
  carryExisting,
  lockedValueIds,
  matrixFromVariants,
  emptyMatrix,
  validateMatrix,
  variantRows,
  withTrailingBlank,
  type VariantGroup,
  type VariantMatrixState,
} from "./variant-matrix-model";

const group = (id: string, name: string, ...texts: string[]): VariantGroup => ({
  id,
  name,
  values: withTrailingBlank(texts.map((text, index) => ({id: `${id}${index}`, text}))),
});

const state = (groups: VariantGroup[], cells: VariantMatrixState["cells"] = {}): VariantMatrixState => ({
  ...emptyMatrix(),
  groups,
  cells,
});

describe("variant matrix", () => {
  it("makes one row for every combination, ignoring the empty boxes", () => {
    const rows = variantRows(state([group("c", "Màu", "Đỏ", "Vàng"), group("s", "Size", "S", "M")]));
    expect(rows.map((row) => row.options.map((option) => option.value).join("/"))).toEqual(["Đỏ/S", "Đỏ/M", "Vàng/S", "Vàng/M"]);
  });

  it("treats a group with no option as absent, and no group as no rows", () => {
    expect(variantRows(state([group("c", "Màu", "Đỏ"), group("s", "Size")]))).toHaveLength(1);
    expect(variantRows(state([group("c", "Màu")]))).toEqual([]);
    expect(variantRows(emptyMatrix())).toEqual([]);
  });

  it("keeps a row's key when an option is renamed", () => {
    const before = variantRows(state([group("c", "Màu", "Đỏ")]))[0].key;
    const renamed = group("c", "Màu", "Đỏ đậm");
    expect(variantRows(state([renamed]))[0].key).toBe(before);
  });

  it("asks for a group name, rejects repeats, and wants a whole number for price and stock", () => {
    const cell = (price: string, quantity: string, sku = "A") => ({price, quantity, sku, warranty: "12"});
    expect(validateMatrix(state([group("c", "", "Đỏ")]))).toEqual({code: "groupName"});
    expect(validateMatrix(state([group("a", "Màu", "Đỏ"), group("b", "màu", "S")]))).toEqual({code: "duplicateGroup"});
    expect(validateMatrix(state([group("c", "Màu", "Đỏ", "đỏ")]))).toEqual({code: "duplicateValue"});
    expect(validateMatrix(state([group("c", "Màu", "Đỏ", "Vàng")], {c0: cell("100", "0")}))).toEqual({code: "cells", count: 1});
    expect(validateMatrix(state([group("c", "Màu", "Đỏ")], {c0: cell("12.5", "0")}))).toEqual({code: "cells", count: 1});
    expect(validateMatrix(state([group("c", "Màu", "Đỏ")], {c0: cell("100", "3")}))).toBeNull();
  });

  it("does not make a SKU up: a row without one is a problem, and so are two rows with the same one", () => {
    const cell = (sku: string) => ({price: "100", quantity: "1", sku, warranty: "12"});
    expect(validateMatrix(state([group("c", "Màu", "Đỏ")], {c0: cell("  ")}))).toEqual({code: "cells", count: 1});
    expect(validateMatrix(state([group("c", "Màu", "Đỏ", "Vàng")], {c0: cell("a-1"), c1: cell("A-1")}))).toEqual({code: "duplicateSku"});
    expect(validateMatrix({...emptyMatrix(), single: {price: "5", quantity: "0", sku: "", warranty: "12"}})).toEqual({
      code: "cells",
      count: 1,
    });
  });

  it("wants the warranty to be a whole number of months, at least 1", () => {
    const cell = (warranty: string) => ({price: "100", quantity: "1", sku: "A", warranty});
    for (const bad of ["0", "", "-3", "1.5"]) {
      expect(validateMatrix(state([group("c", "Màu", "Đỏ")], {c0: cell(bad)}))).toEqual({code: "cells", count: 1});
    }
    expect(validateMatrix(state([group("c", "Màu", "Đỏ")], {c0: cell("36")}))).toBeNull();
  });

  it("sends the model and barcode when typed, leaves them out when empty, and rejects a barcode used twice", () => {
    const cell = (barcode: string) => ({
      price: "1",
      quantity: "1",
      sku: barcode || "S",
      warranty: "12",
      model: " M1 ",
      barcode,
      releaseAt: barcode ? "2026-03-01" : "",
      description: barcode ? " Hàng mới " : "",
    });
    const two = (a: string, b: string) => state([group("c", "Màu", "Đỏ", "Vàng")], {c0: cell(a), c1: {...cell(b), sku: "S2"}});
    expect(validateMatrix(two("123", "123"))).toEqual({code: "duplicateBarcode"});
    expect(validateMatrix(two("", ""))).toBeNull();
    const [first] = buildVariationItems(two("123", ""));
    expect(first).toMatchObject({model: "M1", barcode: "123", releaseAt: "2026-03-01", description: "Hàng mới"});
    expect(buildVariationItems(two("", ""))[0].barcode).toBeUndefined();
    expect(buildVariationItems(two("", ""))[0].releaseAt).toBeUndefined();
    expect(buildVariationItems(two("", ""))[0].description).toBeUndefined();
  });

  it("builds a request per row with the options and the SKU as typed", () => {
    const built = buildVariationItems(
      state([group("c", "Màu", "Đỏ")], {c0: {price: "100", quantity: "3", sku: " AO-DO ", warranty: "24"}}),
    );
    expect(built).toHaveLength(1);
    expect(built[0]).toMatchObject({
      price: 100,
      quantity: 3,
      sku: "AO-DO",
      warrantyMonths: 24,
      options: [{name: "Màu", value: "Đỏ"}],
    });
  });

  it("makes one variant without options from the single price, or none when it is empty", () => {
    expect(buildVariationItems(emptyMatrix())).toEqual([]);
    const single = {...emptyMatrix(), single: {price: "50", quantity: "2", sku: "MY-SKU", warranty: "12"}};
    const [only] = buildVariationItems(single);
    expect(only).toMatchObject({price: 50, quantity: 2, sku: "MY-SKU", options: undefined});
  });

  describe("editing the variants a product already sells", () => {
    const sold = (id: string, options: [string, string][], extra: Partial<ProductVariant> = {}): ProductVariant => ({
      id,
      productId: "p1",
      sku: `SKU-${id}`,
      price: 100,
      quantity: 7,
      warrantyMonths: 12,
      status: "ACTIVE",
      options: options.map(([name, value]) => ({id: `${id}-${name}`, name, value})),
      ...extra,
    });

    it("turns the variants into groups, options and one row each", () => {
      const matrix = matrixFromVariants([sold("a", [["Màu", "Đen"]]), sold("b", [["Màu", "Trắng"]])]);

      expect(matrix.groups.map((group) => group.name)).toEqual(["Màu"]);
      expect(variantRows(matrix).map((row) => row.options[0].value)).toEqual(["Đen", "Trắng"]);
      expect(buildVariationItems(matrix).map((item) => item.id)).toEqual(["a", "b"]);
    });

    it("sends an existing variant without stock and a new one with its opening stock", () => {
      const matrix = matrixFromVariants([sold("a", [["Màu", "Đen"]])]);
      const color = matrix.groups[0];
      const white = color.values.find((value) => !value.text)!;
      const grown: VariantMatrixState = {
        ...matrix,
        groups: [{...color, values: withTrailingBlank(color.values.map((value) => (value.id === white.id ? {...value, text: "Trắng"} : value)))}],
        cells: {...matrix.cells, [white.id]: {price: "100", quantity: "4", sku: "NEW", warranty: "12"}},
      };

      const [existing, added] = buildVariationItems(grown);
      expect(existing).toMatchObject({id: "a", quantity: undefined});
      expect(added).toMatchObject({sku: "NEW", quantity: 4});
      expect(added.id).toBeUndefined();
    });

    it("keeps the single variant on the first row when the product gains a group", () => {
      const single = matrixFromVariants([sold("a", [])]);
      expect(single.single.variantId).toBe("a");
      const withGroup = {...single, groups: [group("c", "Màu", "Đen", "Trắng")]};

      const carried = carryExisting(single, withGroup);

      expect(buildVariationItems({...carried, cells: {...carried.cells, c1: {price: "1", quantity: "0", sku: "W", warranty: "12"}}})
        .map((item) => item.id)).toEqual(["a", undefined]);
    });

    it("keeps an existing variant when the groups are removed", () => {
      const grouped = matrixFromVariants([sold("a", [["Màu", "Đen"]]), sold("b", [["Màu", "Trắng"]])]);

      const carried = carryExisting(grouped, {...grouped, groups: []});

      expect(buildVariationItems(carried)).toEqual([expect.objectContaining({id: "a", options: undefined})]);
    });

    it("locks the options an ordered variant uses", () => {
      const matrix = matrixFromVariants([sold("a", [["Màu", "Đen"]], {hasOrders: true}), sold("b", [["Màu", "Trắng"]])]);
      const [black, white] = matrix.groups[0].values;

      const locked = lockedValueIds(matrix);

      expect(locked.has(black.id)).toBe(true);
      expect(locked.has(white.id)).toBe(false);
    });

    it("puts a picture on an option only when its variants share it", () => {
      const matrix = matrixFromVariants([
        sold("a", [["Màu", "Đen"], ["RAM", "8GB"]], {imageFileId: "f1"}),
        sold("b", [["Màu", "Đen"], ["RAM", "16GB"]], {imageFileId: "f2"}),
        sold("c", [["Màu", "Trắng"], ["RAM", "8GB"]], {imageFileId: "f3"}),
      ]);
      const [black, white] = matrix.groups[0].values;

      expect(matrix.images[black.id]).toBeUndefined();
      expect(matrix.images[white.id]?.fileId).toBe("f3");
      expect(buildVariationItems(matrix).find((item) => item.id === "b")?.imageFileId).toBe("f2");
    });
  });
});
