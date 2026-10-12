import {describe, expect, it} from "vitest";

import {
  buildVariantRequests,
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
    expect(validateMatrix({...emptyMatrix(), single: {price: "5", quantity: "0", sku: "", warranty: "12"}})).toEqual({code: "cells", count: 1});
  });

  it("wants the warranty to be a whole number of months, at least 1", () => {
    const cell = (warranty: string) => ({price: "100", quantity: "1", sku: "A", warranty});
    for (const bad of ["0", "", "-3", "1.5"]) {
      expect(validateMatrix(state([group("c", "Màu", "Đỏ")], {c0: cell(bad)}))).toEqual({code: "cells", count: 1});
    }
    expect(validateMatrix(state([group("c", "Màu", "Đỏ")], {c0: cell("36")}))).toBeNull();
  });

  it("sends the model and barcode when typed, leaves them out when empty, and rejects a barcode used twice", () => {
    const cell = (barcode: string) => ({price: "1", quantity: "1", sku: barcode || "S", warranty: "12", model: " M1 ", barcode, releaseAt: barcode ? "2026-03-01" : "", description: barcode ? " Hàng mới " : ""});
    const two = (a: string, b: string) => state([group("c", "Màu", "Đỏ", "Vàng")], {c0: cell(a), c1: {...cell(b), sku: "S2"}});
    expect(validateMatrix(two("123", "123"))).toEqual({code: "duplicateBarcode"});
    expect(validateMatrix(two("", ""))).toBeNull();
    const [first] = buildVariantRequests(two("123", ""));
    expect(first.request).toMatchObject({model: "M1", barcode: "123", releaseAt: "2026-03-01", description: "Hàng mới"});
    expect(buildVariantRequests(two("", ""))[0].request.barcode).toBeUndefined();
    expect(buildVariantRequests(two("", ""))[0].request.releaseAt).toBeUndefined();
    expect(buildVariantRequests(two("", ""))[0].request.description).toBeUndefined();
  });

  it("builds a request per row with the options and the SKU as typed", () => {
    const built = buildVariantRequests(state([group("c", "Màu", "Đỏ")], {c0: {price: "100", quantity: "3", sku: " AO-DO ", warranty: "24"}}));
    expect(built).toHaveLength(1);
    expect(built[0].request).toMatchObject({price: 100, quantity: 3, sku: "AO-DO", warrantyMonths: 24, options: [{name: "Màu", value: "Đỏ"}]});
  });

  it("makes one variant without options from the single price, or none when it is empty", () => {
    expect(buildVariantRequests(emptyMatrix())).toEqual([]);
    const single = {...emptyMatrix(), single: {price: "50", quantity: "2", sku: "MY-SKU", warranty: "12"}};
    const [only] = buildVariantRequests(single);
    expect(only.request).toMatchObject({price: 50, quantity: 2, sku: "MY-SKU", options: undefined});
  });
});
