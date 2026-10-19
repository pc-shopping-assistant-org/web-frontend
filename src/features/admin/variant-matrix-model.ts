import type {CreateProductVariantRequest} from "@/features/admin/contracts/catalog";

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
  | {code: "cells"; count: number};

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

export type VariantToCreate = {key: string; request: CreateProductVariantRequest};

/** Assumes `validateMatrix` passed. Returns nothing for a product left without price and groups. */
export function buildVariantRequests(state: VariantMatrixState): VariantToCreate[] {
  const rows = variantRows(state);
  if (rows.length === 0) {
    if (!state.single.price.trim()) return [];
    return [{key: "single", request: requestOf(state.single, [], undefined)}];
  }
  return rows.map((row) => ({
    key: row.key,
    request: requestOf(cellOf(state, row.key), row.options, state.images[row.values[0].id]),
  }));
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
    imageFileId: image?.fileId,
    options: options.length ? options : undefined,
  };
}
