import {backendFetch} from "@/lib/api/client";
import type {AttributeDefinitionDto, CategorySpecsDto, DiscountDto, SupplierDto} from "@/features/admin/contracts/dto";
import type {AdminProductFilter, DiscountFilter, ReviewFilter, SupplierFilter} from "@/features/admin/contracts/filters";
import {
  mapAttributeDefinition,
  mapCategorySpecs,
  mapDiscountDetail,
  mapSupplier,
  mapDiscountsPage,
  mapSuppliersPage,
} from "@/features/admin/mappers";
import type {DiscountsPageDto, SuppliersPageDto} from "@/features/admin/contracts/dto";
import type {CategoryDto, BrandDto} from "@/features/catalog/contracts/dto";
import {buildCategoryTree, mapBrandResponse, mapCategoryResponse} from "@/features/catalog/mappers";
import type {ProductDetailDto, ProductPageDto, ProductVariantDto, ReviewDto, ReviewsPageDto} from "@/features/catalog/contracts/dto";
import {mapProductDetail, mapProductPage, mapProductVariant, mapReview, mapReviewsPage} from "@/features/catalog/mappers";
import type {} from "@/features/orders/contracts/dto";
import {} from "@/features/orders/mappers";
import {
  createAttributeDefinitionRequestSchema,
  createBrandRequestSchema,
  createCategoryRequestSchema,
  createDiscountRequestSchema,
  createProductRequestSchema,
  createProductVariantRequestSchema,
  createSupplierRequestSchema,
  updateAttributeDefinitionRequestSchema,
  updateBrandRequestSchema,
  updateCategoryRequestSchema,
  updateDiscountRequestSchema,
  updateDiscountStatusRequestSchema,
  updateProductRequestSchema,
  updateProductVariantRequestSchema,
  updateResourceStatusRequestSchema,
  replaceCategorySpecsRequestSchema,
  updateReviewStatusRequestSchema,
  updateSupplierRequestSchema,
} from "@/features/admin/contracts/requests";
import {parseRequest} from "@/lib/api/parse-request";
import type {
  CreateAttributeDefinitionRequest,
  CreateBrandRequest,
  CreateCategoryRequest,
  CreateDiscountRequest,
  CreateProductRequest,
  CreateProductVariantRequest,
  CreateSupplierRequest,
  ReplaceCategorySpecsRequest,
  UpdateAttributeDefinitionRequest,
  UpdateBrandRequest,
  UpdateCategoryRequest,
  UpdateDiscountRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
  UpdateSupplierRequest,
} from "@/features/admin/contracts/requests";

const CATALOG = "/catalog-service";
const PROMOTION = "/promotion-service";

function queryString(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== "") params.set(key, String(value));
  return params.size ? `?${params.toString()}` : "";
}

export function getAdminProducts(filter: AdminProductFilter = {}) {
  return backendFetch<ProductPageDto>(`/catalog-service/products/admin${queryString(filter)}`).then(mapProductPage);
}
export function getSuppliers(filter: SupplierFilter = {}) {
  return backendFetch<SuppliersPageDto>(`/admin/suppliers${queryString(filter)}`).then(mapSuppliersPage);
}
export function getDiscounts(filter: DiscountFilter = {}) {
  return backendFetch<DiscountsPageDto>(`${PROMOTION}/discounts${queryString(filter)}`).then(mapDiscountsPage);
}
export function getAdminReviews(filter: ReviewFilter = {}) {
  return backendFetch<ReviewsPageDto>(`/admin/reviews${queryString(filter)}`).then(mapReviewsPage);
}
export function getAdminDiscount(id: string) {
  return backendFetch<DiscountDto>(`${PROMOTION}/discounts/${encodeURIComponent(id)}`).then(mapDiscountDetail);
}
export function getAdminSupplier(id: string) {
  return backendFetch<SupplierDto>(`/admin/suppliers/${encodeURIComponent(id)}`).then(mapSupplier);
}
export function getAttributes() {
  return backendFetch<AttributeDefinitionDto[]>(`${CATALOG}/attribute-definitions`).then((attributes) =>
    attributes.map(mapAttributeDefinition),
  );
}
export function getCategorySpecsSchema(categoryId: string) {
  return backendFetch<CategorySpecsDto>(`/catalog-service/categories/${encodeURIComponent(categoryId)}/attributes`).then(mapCategorySpecs);
}
export function getAdminProductById(id: string) {
  return backendFetch<ProductDetailDto>(`/catalog-service/products/admin/${encodeURIComponent(id)}`).then(mapProductDetail);
}
/** The file shape media-service returns; the admin model keeps its older field names. */
type MediaFileDto = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt?: string;
};

export function uploadAdminFile(file: globalThis.File) {
  const body = new FormData();
  body.append("file", file);
  return backendFetch<MediaFileDto>("/media-service/files", {
    method: "POST",
    body,
  }).then((dto) => ({
    id: dto.id,
    originalName: dto.originalName,
    mimeType: dto.mimeType,
    sizeBytes: dto.sizeBytes,
    publicUrl: dto.url,
    createdAt: dto.createdAt,
  }));
}

export function updateProductStatus(productId: string, status: string) {
  const payload = parseRequest(updateResourceStatusRequestSchema, {status});
  return backendFetch<ProductDetailDto>(`${CATALOG}/products/${encodeURIComponent(productId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({status: payload.status}),
  }).then(mapProductDetail);
}
export function updateDiscountStatus(id: string, status: string) {
  const payload = parseRequest(updateDiscountStatusRequestSchema, {status});
  return backendFetch<DiscountDto>(`${PROMOTION}/discounts/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({status: payload.status}),
  }).then(mapDiscountDetail);
}
export function updateReviewStatus(id: string, status: string, reason?: string) {
  const payload = parseRequest(updateReviewStatusRequestSchema, {status, reason});
  return backendFetch<ReviewDto>(`/admin/reviews/${encodeURIComponent(id)}/status`, {method: "PATCH", body: JSON.stringify(payload)}).then(
    mapReview,
  );
}

export function updateProduct(id: string, request: UpdateProductRequest) {
  const payload = parseRequest(updateProductRequestSchema, request);
  return backendFetch<ProductDetailDto>(`${CATALOG}/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then(mapProductDetail);
}
export function createVariant(productId: string, request: CreateProductVariantRequest) {
  const payload = parseRequest(createProductVariantRequestSchema, request);
  return backendFetch<ProductVariantDto>(`${CATALOG}/products/${encodeURIComponent(productId)}/variants`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapProductVariant);
}
/** The details and the status are two backend calls; the status one only when it differs. */
export async function updateVariant(productId: string, id: string, request: UpdateProductVariantRequest) {
  const {status, ...details} = parseRequest(updateProductVariantRequestSchema, request);
  const path = `${CATALOG}/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(id)}`;
  let variant = await backendFetch<ProductVariantDto>(path, {method: "PUT", body: JSON.stringify(details)});
  if (status && status !== variant.status) {
    variant = await backendFetch<ProductVariantDto>(`${path}/status`, {method: "PATCH", body: JSON.stringify({status})});
  }
  return mapProductVariant(variant);
}
export function deleteVariant({productId, id}: {productId: string; id: string}) {
  return backendFetch<null>(`${CATALOG}/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(id)}`, {method: "DELETE"});
}
export function createDiscount(request: CreateDiscountRequest) {
  const payload = parseRequest(createDiscountRequestSchema, request);
  return backendFetch<DiscountDto>(`${PROMOTION}/discounts`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapDiscountDetail);
}
/** The definition and the status are two backend calls; the status one only when it differs. */
export async function updateDiscount(id: string, request: UpdateDiscountRequest) {
  const {status, ...definition} = parseRequest(updateDiscountRequestSchema, request);
  const path = `${PROMOTION}/discounts/${encodeURIComponent(id)}`;
  // The backend keeps the current code when it is omitted and removes it when it is blank, so a cleared code is sent as ""
  let discount = await backendFetch<DiscountDto>(path, {method: "PUT", body: JSON.stringify({...definition, code: definition.code ?? ""})});
  if (status && status !== discount.status) {
    discount = await backendFetch<DiscountDto>(`${path}/status`, {method: "PATCH", body: JSON.stringify({status})});
  }
  return mapDiscountDetail(discount);
}
export function deleteDiscount(id: string) {
  return backendFetch<null>(`${PROMOTION}/discounts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
export function createSupplier(request: CreateSupplierRequest) {
  const payload = parseRequest(createSupplierRequestSchema, request);
  return backendFetch<SupplierDto>("/admin/suppliers", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapSupplier);
}
export function updateSupplier(id: string, request: UpdateSupplierRequest) {
  const payload = parseRequest(updateSupplierRequestSchema, request);
  return backendFetch<SupplierDto>(`/admin/suppliers/${encodeURIComponent(id)}`, {method: "PUT", body: JSON.stringify(payload)}).then(
    mapSupplier,
  );
}
export function deleteSupplier(id: string) {
  return backendFetch<string>(`/admin/suppliers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function createAttribute(request: CreateAttributeDefinitionRequest) {
  const payload = parseRequest(createAttributeDefinitionRequestSchema, request);
  return backendFetch<AttributeDefinitionDto>(`${CATALOG}/attribute-definitions`, {method: "POST", body: JSON.stringify(payload)}).then(
    mapAttributeDefinition,
  );
}
export function updateAttribute(id: string, request: UpdateAttributeDefinitionRequest) {
  const payload = parseRequest(updateAttributeDefinitionRequestSchema, request);
  return backendFetch<AttributeDefinitionDto>(`${CATALOG}/attribute-definitions/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then(mapAttributeDefinition);
}
export function deleteAttribute(id: string) {
  return backendFetch<string>(`${CATALOG}/attribute-definitions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/** The whole specification form of a category is replaced in one call: groups, their attributes and the order. */
export function replaceCategorySpecs(categoryId: string, request: ReplaceCategorySpecsRequest) {
  const payload = parseRequest(replaceCategorySpecsRequestSchema, request);
  return backendFetch<CategorySpecsDto>(`${CATALOG}/categories/${encodeURIComponent(categoryId)}/attributes`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then(mapCategorySpecs);
}

/** Every category including inactive ones, as a tree. */
export async function getAdminCategories() {
  return buildCategoryTree(await backendFetch<CategoryDto[]>(`${CATALOG}/categories/admin`));
}
export function createCategory(request: CreateCategoryRequest) {
  const payload = parseRequest(createCategoryRequestSchema, request);
  return backendFetch<CategoryDto>(`${CATALOG}/categories`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapCategoryResponse);
}
export function updateCategory(id: string, request: UpdateCategoryRequest) {
  const payload = parseRequest(updateCategoryRequestSchema, request);
  return backendFetch<CategoryDto>(`${CATALOG}/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }).then(mapCategoryResponse);
}
export function deleteCategory(id: string) {
  return backendFetch<null>(`${CATALOG}/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/** Every brand including inactive ones. */
export async function getAdminBrands() {
  return (await backendFetch<BrandDto[]>(`${CATALOG}/brands/admin`)).map(mapBrandResponse);
}
export function createBrand(request: CreateBrandRequest) {
  const payload = parseRequest(createBrandRequestSchema, request);
  return backendFetch<BrandDto>(`${CATALOG}/brands`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(mapBrandResponse);
}
/** The details and the status are two backend calls; the status one only when it is asked for. */
export async function updateBrand(id: string, request: UpdateBrandRequest) {
  const {status, ...details} = parseRequest(updateBrandRequestSchema, request);
  const path = `${CATALOG}/brands/${encodeURIComponent(id)}`;
  let brand = await backendFetch<BrandDto>(path, {method: "PUT", body: JSON.stringify(details)});
  if (status && status !== brand.status) {
    brand = await backendFetch<BrandDto>(`${path}/status`, {method: "PATCH", body: JSON.stringify({status})});
  }
  return mapBrandResponse(brand);
}
export function deleteBrand(id: string) {
  return backendFetch<null>(`${CATALOG}/brands/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
export function createProduct(request: CreateProductRequest) {
  const payload = parseRequest(createProductRequestSchema, request);
  return backendFetch<ProductDetailDto>(`${CATALOG}/products`, {method: "POST", body: JSON.stringify(payload)}).then(mapProductDetail);
}
export function deleteProduct(id: string) {
  return backendFetch<null>(`${CATALOG}/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/** What a full rebuild of the search index did: documents written, documents dropped, products that failed (run again for those). */
export type SearchIndexSyncResult = {indexed: number; removed: number; failed: number};

/** Rebuilds the whole search index from the catalog (ADMIN); it reads every product, so it can take a while. */
export function syncSearchIndex() {
  return backendFetch<SearchIndexSyncResult>("/sync-service/products/sync", {method: "POST"});
}

/** Catalog changes the index could not take in (the catalog or Elasticsearch was down too long, or the event was unreadable). */
export type DeadLetterStatus = {pending: number};
export type DeadLetterReplayResult = {replayed: number; skipped: number; pending: number; blocked: boolean};

export function getDeadLetterStatus() {
  return backendFetch<DeadLetterStatus>("/sync-service/products/sync/dlt");
}

/** Runs the parked changes through the index again, oldest first (ADMIN). */
export function replayDeadLetters() {
  return backendFetch<DeadLetterReplayResult>("/sync-service/products/sync/dlt/replay", {method: "POST"});
}
