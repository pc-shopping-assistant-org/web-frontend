"use client";

import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {createProductReview, getBrands, getCategories, getCategorySpecLabels, getMyProductReviews, getOrderLineProduct, getReviewedOrderItems, getProductBySlug, getProductReviews, getProducts, updateProductReview, type ProductFilters} from "./api";

export const catalogKeys = {
  all: ["catalog"] as const,
  products: (filters: ProductFilters) => ["catalog", "products", filters] as const,
  product: (slug: string) => ["catalog", "product", slug] as const,
  categories: ["catalog", "categories"] as const,
  brands: ["catalog", "brands"] as const,
  reviews: (productId: string, page: number) => ["catalog", "reviews", productId, "list", page] as const,
  myReviews: (productId: string) => ["catalog", "reviews", productId, "mine"] as const,
};

export function useProducts(
  filters: ProductFilters = {},
  options: {enabled?: boolean} = {},
) {
  return useQuery({
    queryKey: catalogKeys.products(filters),
    queryFn: () => getProducts(filters),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useCategories() {
  return useQuery({queryKey: catalogKeys.categories, queryFn: getCategories, staleTime: 300_000});
}

export function useCategorySpecLabels(categoryId?: string) {
  return useQuery({
    queryKey: ["catalog", "spec-labels", categoryId],
    queryFn: () => getCategorySpecLabels(categoryId!),
    enabled: Boolean(categoryId),
    staleTime: 300_000,
  });
}

export function useBrands() {
  return useQuery({queryKey: catalogKeys.brands, queryFn: getBrands, staleTime: 300_000});
}

export function useProductReviews(productId: string, page = 0, options: {enabled?: boolean} = {}) {
  return useQuery({
    queryKey: catalogKeys.reviews(productId, page),
    queryFn: () => getProductReviews(productId, page),
    enabled: Boolean(productId) && (options.enabled ?? true),
    retry: false,
    placeholderData: keepPreviousData,
  });
}

export function useMyProductReviews(productId: string, enabled = true) {
  return useQuery({
    queryKey: catalogKeys.myReviews(productId),
    queryFn: () => getMyProductReviews(productId),
    enabled: Boolean(productId) && enabled,
    retry: false,
  });
}

/** A new, edited or refused review changes what the product page shows, so every review list of the product is refreshed. */
function useReviewMutation<TVariables extends {productId: string}, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: (_result, _error, variables) => Promise.all([
      queryClient.invalidateQueries({queryKey: ["catalog", "reviews", variables.productId]}),
      queryClient.invalidateQueries({queryKey: ["catalog", "reviewed-items"]}),
    ]),
  });
}

export function useCreateProductReview() {
  return useReviewMutation(({productId, request}: {productId: string; request: Parameters<typeof createProductReview>[1]}) => createProductReview(productId, request));
}

export function useUpdateProductReview() {
  return useReviewMutation(({productId, reviewId, request}: {productId: string; reviewId: string; request: Parameters<typeof updateProductReview>[2]}) => updateProductReview(productId, reviewId, request));
}

/** The lines of a completed order that the customer has reviewed already; pass no ids while the order is not completed. */
export function useReviewedOrderItems(orderItemIds: string[]) {
  return useQuery({
    queryKey: ["catalog", "reviewed-items", orderItemIds],
    queryFn: () => getReviewedOrderItems(orderItemIds),
    enabled: orderItemIds.length > 0,
    retry: false,
  });
}

export function useOrderLineProduct(variantId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["catalog", "order-line-product", variantId],
    queryFn: () => getOrderLineProduct(variantId!),
    enabled: Boolean(variantId) && enabled,
    retry: false,
    staleTime: 300_000,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: catalogKeys.product(slug),
    queryFn: () => getProductBySlug(slug),
    enabled: Boolean(slug),
  });
}
