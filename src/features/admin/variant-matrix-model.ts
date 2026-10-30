import type {CreateProductVariantRequest, VariationItemRequest} from "@/features/admin/contracts/catalog";
import type {ProductVariant} from "@/features/catalog/contracts/responses";

/** Two levels, as on the seller pages people already know: "Color" and "Size". */
export const MAX_VARIANT_GROUPS = 2;
export const MAX_VALUES_PER_GROUP = 10;
const DEFAULT_WARRANTY_MONTHS = "12";

export type VariantValue = {id: string; text: string};
export type VariantGroup = {id: string; name: string; values: VariantValue[]};
/** The model, the barcode and the release date (a `yyyy-mm-dd` day) and the description are optional; an empty one is left out of the request. */
export type VariantCell = {
  price: string;
  quantity: string;
  sku: string;
  warranty: string;
  model?: string;
  barcode?: string;
  releaseAt?: string;
  description?: string;
  /** Set when the row is an existing variant: it keeps its stock, which only a stock adjustment changes. */
  variantId?: string;
  /** The existing variant has been ordered, so its option values can no longer change. */
  ordered?: boolean;
  /** The own picture of an existing variant, used when its option of the first group has none. */
  image?: VariantImage;
};
export type VariantImage = {fileId: string; url?: string};

export type VariantMatrixState = {
  groups: VariantGroup[];
  /** Keyed by the row key, so renaming an option keeps what was typed for its rows. */
  cells: Record<string, VariantCell>;
  /** The one price and stock of a product without groups. */
  single: VariantCell;
  /** A picture per value of the first group, as in the example the page is modelled on. */
  images: Record<string, VariantImage>;
};

export type VariantRow = {key: string; values: VariantValue[]; options: {name: string; value: string}[]};

export type VariantProblem =
  | {code: "groupName"}
  | {code: "duplicateGroup"}
  | {code: "duplicateValue"}
  | {code: "duplicateSku"}
  | {code: "duplicateBarcode"}
  | {code: "cells"; count: number}
  | {code: "empty"};

export const EMPTY_CELL: VariantCell = {price: "", quantity: "0", sku: "", warranty: DEFAULT_WARRANTY_MONTHS};

let counter = 0;
export function newId() {
  counter += 1;
  return `v${counter}`;
}

/** Every list of values ends with one empty box: typing in it is how the next option is added. */
export function withTrailingBlank(values: VariantValue[]): VariantValue[] {
  const last = values[values.length - 1];
  if (last && !last.text.trim()) return values;
  return values.length >= MAX_VALUES_PER_GROUP ? values : [...values, {id: newId(), text: ""}];
}

export function newGroup(): VariantGroup {
  return {id: newId(), name: "", values: withTrailingBlank([])};
}

export function emptyMatrix(): VariantMatrixState {
  return {groups: [], cells: {}, single: {...EMPTY_CELL}, images: {}};
}

const filled = (group: VariantGroup) => group.values.filter((value) => value.text.trim());

/** The groups that take part: a group with no option typed yet is not one. */
function activeGroups(state: VariantMatrixState) {
  return state.groups.filter((group) => filled(group).length > 0);
}

/** One row for every combination of the options, in the order the boxes are shown. */
export function variantRows(state: VariantMatrixState): VariantRow[] {
  const groups = activeGroups(state);
  let rows: VariantRow[] = [{key: "", values: [], options: []}];
  for (const group of groups) {
    rows = rows.flatMap((row) =>
      filled(group).map((value) => ({
        key: row.key ? `${row.key}:${value.id}` : value.id,
        values: [...row.values, value],
        options: [...row.options, {name: group.name.trim(), value: value.text.trim()}],
      })),
    );
  }
  return groups.length ? rows : [];
}

const isCount = (text: string) => /^\d+$/.test(text.trim());
const isPositive = (text: string) => /^[1-9]\d*$/.test(text.trim());

/** A row can be sent when price and stock are whole numbers, the warranty is at least a month and there is a SKU. */
export function isValidCell(cell: Pick<VariantCell, "price" | "quantity" | "sku" | "warranty">) {
  return isCount(cell.price) && isCount(cell.quantity) && Boolean(cell.sku.trim()) && isPositive(cell.warranty);
}

export function cellOf(state: VariantMatrixState, key: string): VariantCell {
  return state.cells[key] ?? EMPTY_CELL;
}

export function validateMatrix(state: VariantMatrixState): VariantProblem | null {
  const groups = activeGroups(state);
  if (groups.some((group) => !group.name.trim())) return {code: "groupName"};
  const names = groups.map((group) => group.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) return {code: "duplicateGroup"};
  for (const group of groups) {
    const texts = filled(group).map((value) => value.text.trim().toLowerCase());
    if (new Set(texts).size !== texts.length) return {code: "duplicateValue"};
  }
  const rows = variantRows(state);
  const cells = rows.length ? rows.map((row) => cellOf(state, row.key)) : state.single.price.trim() ? [state.single] : [];
  const bad = cells.filter((cell) => !isValidCell(cell)).length;
  if (bad) return {code: "cells", count: bad};
  const skus = cells.map((cell) => cell.sku.trim().toLowerCase());
  if (new Set(skus).size !== skus.length) return {code: "duplicateSku"};
  const barcodes = cells.map((cell) => (cell.barcode ?? "").trim().toLowerCase()).filter(Boolean);
  return new Set(barcodes).size !== barcodes.length ? {code: "duplicateBarcode"} : null;
}

/**
 * The list `PUT /variations` takes, assuming `validateMatrix` passed: an existing variant is sent with its id and
 * without stock (the backend keeps its stock), a new one with its opening stock.
 */
export function buildVariationItems(state: VariantMatrixState): VariationItemRequest[] {
  const rows = variantRows(state);
  const cells = rows.length
    ? rows.map((row) => ({cell: cellOf(state, row.key), options: row.options, image: state.images[row.values[0].id]}))
    : state.single.price.trim()
      ? [{cell: state.single, options: [], image: undefined}]
      : [];
  return cells.map(({cell, options, image}) => {
    const request = requestOf(cell, options, image);
    return cell.variantId ? {...request, id: cell.variantId, quantity: undefined} : request;
  });
}

const optionKey = (text: string) => text.trim().toLowerCase();

export function cellFromVariant(variant: ProductVariant): VariantCell {
  return {
    price: String(variant.price),
    quantity: String(variant.quantity),
    sku: variant.sku,
    warranty: String(variant.warrantyMonths ?? DEFAULT_WARRANTY_MONTHS),
    model: variant.model ?? "",
    barcode: variant.barcode ?? "",
    releaseAt: variant.releaseAt ?? "",
    description: variant.description ?? "",
    variantId: variant.id,
    ordered: variant.hasOrders,
    image: variant.imageFileId ? {fileId: variant.imageFileId, url: variant.imageUrl} : undefined,
  };
}

/**
 * The variants on sale as the editor shows them: their option names become the groups, their values the options, and
 * each variant the row of its combination. A product without options becomes the single price and stock.
 */
export function matrixFromVariants(variants: ProductVariant[]): VariantMatrixState {
  const state = emptyMatrix();
  const names = [...new Set(variants.flatMap((variant) => variant.options.map((option) => option.name.trim())))].slice(0, MAX_VARIANT_GROUPS);
  if (names.length === 0) {
    return variants[0] ? {...state, single: cellFromVariant(variants[0])} : state;
  }
  const valueOf = (variant: ProductVariant, name: string) =>
    variant.options.find((option) => optionKey(option.name) === optionKey(name))?.value.trim() ?? "";
  const groups: VariantGroup[] = names.map((name) => {
    const values: VariantValue[] = [];
    for (const variant of variants) {
      const text = valueOf(variant, name);
      if (text && !values.some((value) => optionKey(value.text) === optionKey(text))) values.push({id: newId(), text});
    }
    return {id: newId(), name, values: withTrailingBlank(values)};
  });
  const valueIdOf = (group: VariantGroup, text: string) => group.values.find((value) => text && optionKey(value.text) === optionKey(text))?.id;
  const cells: Record<string, VariantCell> = {};
  const imagesByValue = new Map<string, Set<string | undefined>>();
  for (const variant of variants) {
    const ids = groups.map((group) => valueIdOf(group, valueOf(variant, group.name)));
    if (ids.some((id) => !id)) continue;
    const key = ids.join(":");
    if (cells[key]) continue;
    cells[key] = cellFromVariant(variant);
    const seen = imagesByValue.get(ids[0]!) ?? new Set();
    seen.add(variant.imageFileId);
    imagesByValue.set(ids[0]!, seen);
  }
  // A picture goes on an option of the first group only when every variant of that option shows the same one
  const images: Record<string, VariantImage> = {};
  for (const [valueId, files] of imagesByValue) {
    const [only] = [...files];
    if (files.size === 1 && only) {
      const owner = variants.find((variant) => variant.imageFileId === only);
      images[valueId] = {fileId: only, url: owner?.imageUrl};
    }
  }
  return {...state, groups, cells, images};
}

/**
 * Keeps the existing variant when the shape changes: a product without groups that gains some puts its variant on the
 * first row (it keeps its stock and orders), and one that drops its groups keeps the first existing variant.
 */
export function carryExisting(previous: VariantMatrixState, next: VariantMatrixState): VariantMatrixState {
  const before = variantRows(previous);
  const after = variantRows(next);
  const single = next.single.variantId;
  if (before.length === 0 && after.length > 0 && single && !Object.values(next.cells).some((cell) => cell.variantId === single)) {
    const first = after[0].key;
    return next.cells[first] ? next : {...next, cells: {...next.cells, [first]: next.single}};
  }
  if (before.length > 0 && after.length === 0 && !next.single.variantId) {
    const kept = before.map((row) => cellOf(previous, row.key)).find((cell) => cell.variantId);
    return kept ? {...next, single: kept} : next;
  }
  return next;
}

/** The options that an ordered variant uses as loaded: renaming one would turn that variant into another item. */
export function lockedValueIds(state: VariantMatrixState): Set<string> {
  return new Set(
    variantRows(state)
      .filter((row) => cellOf(state, row.key).ordered)
      .flatMap((row) => row.values.map((value) => value.id)),
  );
}

function requestOf(
  cell: VariantCell,
  options: {name: string; value: string}[],
  image: VariantImage | undefined,
): CreateProductVariantRequest {
  return {
    price: Number(cell.price),
    quantity: Number(cell.quantity),
    sku: cell.sku.trim(),
    model: cell.model?.trim() || undefined,
    barcode: cell.barcode?.trim() || undefined,
    releaseAt: cell.releaseAt || undefined,
    description: cell.description?.trim() || undefined,
    warrantyMonths: Number(cell.warranty),
    imageFileId: (image ?? cell.image)?.fileId,
    options: options.length ? options : undefined,
  };
}
