"use client";

import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {
  createBrand,
  createCategory,
  createDiscount,
  createAttribute,
  createProduct,
  createSupplier,
  createVariant,
  deleteBrand,
  deleteCategory,
  deleteDiscount,
  deleteProduct,
  deleteSupplier,
  deleteVariant,
  deleteAttribute,
  getAdminDiscount,
  getAdminProducts,
  getAdminReviews,
  getAdminSupplier,
  getAttributes,
  getAdminBrands,
  getAdminCategories,
  getCategorySpecsSchema,
  getDiscounts,
  getAdminProductById,
  getSuppliers,
  updateBrand,
  updateCategory,
  updateDiscount,
  updateAttribute,
  updateProduct,
  updateSupplier,
  updateVariant,
  updateDiscountStatus,
  updateProductStatus,
  replaceCategorySpecs,
  syncSearchIndex,
  getDeadLetterStatus,
  replayDeadLetters,
  updateReviewStatus,
  uploadAdminFile,
} from "./api";

export const adminKeys = {
  all: ["admin"] as const,
  dashboard: ["admin", "dashboard"] as const,
};
export function useAdminProducts(filter: Parameters<typeof getAdminProducts>[0] = {}) {
  return useQuery({
    queryKey: ["admin", "products", filter],
    queryFn: () => getAdminProducts(filter),
    retry: false,
    placeholderData: keepPreviousData,
  });
}
export function useAdminSuppliers(filter: Parameters<typeof getSuppliers>[0] = {}) {
  return useQuery({
    queryKey: ["admin", "suppliers", filter],
    queryFn: () => getSuppliers(filter),
    retry: false,
    placeholderData: keepPreviousData,
  });
}
export function useAdminDiscounts(filter: Parameters<typeof getDiscounts>[0] = {}) {
  return useQuery({
    queryKey: ["admin", "discounts", filter],
    queryFn: () => getDiscounts(filter),
    retry: false,
    placeholderData: keepPreviousData,
  });
}
export function useAdminReviews(filter: Parameters<typeof getAdminReviews>[0] = {}) {
  return useQuery({
    queryKey: ["admin", "reviews", filter],
    queryFn: () => getAdminReviews(filter),
    retry: false,
    placeholderData: keepPreviousData,
  });
}
export function useAdminDiscount(id: string) {
  return useQuery({
    queryKey: ["admin", "discount", id],
    queryFn: () => getAdminDiscount(id),
    enabled: Boolean(id),
    retry: false,
  });
}
export function useAdminSupplier(id: string) {
  return useQuery({
    queryKey: ["admin", "supplier", id],
    queryFn: () => getAdminSupplier(id),
    enabled: Boolean(id),
    retry: false,
  });
}
export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => getAdminProductById(id),
    enabled: Boolean(id),
    retry: false,
  });
}
export function useAttributes() {
  return useQuery({
    queryKey: ["admin", "attributes"],
    queryFn: getAttributes,
    staleTime: 300_000,
    retry: false,
  });
}
export function useCategorySpecsSchema(categoryId: string) {
  return useQuery({
    queryKey: ["admin", "category-specs", categoryId],
    queryFn: () => getCategorySpecsSchema(categoryId),
    enabled: Boolean(categoryId),
    retry: false,
  });
}
export function useUploadAdminFile() {
  return useAdminMutation(uploadAdminFile);
}

function useStatusMutation<TVariables, TData>(mutationFn: (variables: TVariables) => Promise<TData>) {
  const qc = useQueryClient();
  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({queryKey: adminKeys.all}),
  });
}
export function useAdminProductStatus() {
  return useStatusMutation(({id, status}: {id: string; status: string}) => updateProductStatus(id, status));
}
export function useAdminDiscountStatus() {
  return useStatusMutation(({id, status}: {id: string; status: string}) => updateDiscountStatus(id, status));
}
export function useAdminReviewStatus() {
  return useStatusMutation(({id, status, reason}: {id: string; status: string; reason?: string}) => updateReviewStatus(id, status, reason));
}
function useAdminMutation<TVariables, TData>(mutationFn: (variables: TVariables) => Promise<TData>) {
  const qc = useQueryClient();
  return useMutation<TData, Error, TVariables>({
    mutationFn,
    // The storefront caches the same categories and brands, so it is refreshed too
    onSuccess: () => Promise.all([qc.invalidateQueries({queryKey: adminKeys.all}), qc.invalidateQueries({queryKey: ["catalog"]})]),
  });
}
export function useAdminCategories() {
  return useQuery({queryKey: ["admin", "categories"], queryFn: getAdminCategories});
}
export function useAdminBrands() {
  return useQuery({queryKey: ["admin", "brands"], queryFn: getAdminBrands});
}
export function useCreateAdminCategory() {
  return useAdminMutation(createCategory);
}
export function useReplaceAdminCategorySpecs() {
  return useAdminMutation(({categoryId, request}: {categoryId: string; request: Parameters<typeof replaceCategorySpecs>[1]}) =>
    replaceCategorySpecs(categoryId, request),
  );
}
export function useCreateAdminAttribute() {
  return useAdminMutation(createAttribute);
}
export function useUpdateAdminAttribute() {
  return useAdminMutation(({id, request}: {id: string; request: Parameters<typeof updateAttribute>[1]}) => updateAttribute(id, request));
}
export function useDeleteAdminAttribute() {
  return useAdminMutation(deleteAttribute);
}
export function useUpdateAdminCategory() {
  return useAdminMutation(({id, request}: {id: string; request: Parameters<typeof updateCategory>[1]}) => updateCategory(id, request));
}
export function useDeleteAdminCategory() {
  return useAdminMutation(deleteCategory);
}
export function useCreateAdminBrand() {
  return useAdminMutation(createBrand);
}
export function useUpdateAdminBrand() {
  return useAdminMutation(({id, request}: {id: string; request: Parameters<typeof updateBrand>[1]}) => updateBrand(id, request));
}
export function useDeleteAdminBrand() {
  return useAdminMutation(deleteBrand);
}
export function useCreateAdminProduct() {
  return useAdminMutation(createProduct);
}
export function useDeleteAdminProduct() {
  return useAdminMutation(deleteProduct);
}
export function useUpdateAdminProduct() {
  return useAdminMutation(({id, request}: {id: string; request: Parameters<typeof updateProduct>[1]}) => updateProduct(id, request));
}
export function useCreateAdminVariant() {
  return useAdminMutation(({productId, request}: {productId: string; request: Parameters<typeof createVariant>[1]}) =>
    createVariant(productId, request),
  );
}
export function useUpdateAdminVariant() {
  return useAdminMutation(({productId, id, request}: {productId: string; id: string; request: Parameters<typeof updateVariant>[2]}) =>
    updateVariant(productId, id, request),
  );
}
export function useDeleteAdminVariant() {
  return useAdminMutation(deleteVariant);
}
export function useCreateAdminDiscount() {
  return useAdminMutation(createDiscount);
}
export function useUpdateAdminDiscount() {
  return useAdminMutation(({id, request}: {id: string; request: Parameters<typeof updateDiscount>[1]}) => updateDiscount(id, request));
}
export function useDeleteAdminDiscount() {
  return useAdminMutation(deleteDiscount);
}
export function useCreateAdminSupplier() {
  return useAdminMutation(createSupplier);
}
export function useUpdateAdminSupplier() {
  return useAdminMutation(({id, request}: {id: string; request: Parameters<typeof updateSupplier>[1]}) => updateSupplier(id, request));
}
export function useDeleteAdminSupplier() {
  return useAdminMutation(deleteSupplier);
}

/** The index lives in Elasticsearch, not in a cached query, so nothing needs refreshing afterwards. */
export function useSyncSearchIndex() {
  return useMutation({mutationFn: syncSearchIndex});
}
const deadLetterKey = ["admin", "search-index", "dead-letters"] as const;
export function useDeadLetterStatus() {
  return useQuery({queryKey: deadLetterKey, queryFn: getDeadLetterStatus, retry: false});
}
export function useReplayDeadLetters() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: replayDeadLetters,
    onSuccess: () => qc.invalidateQueries({queryKey: deadLetterKey}),
  });
}
