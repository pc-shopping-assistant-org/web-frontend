"use client";

import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {createProductReview, getBrands, getCategories, getProductBySlug, getProductReviews, getProducts, type ProductFilters} from "./api";

export const catalogKeys = {
  all: ["catalog"] as const,
  products: (filters: ProductFilters) => ["catalog", "products", filters] as const,
  product: (slug: string) => ["catalog", "product", slug] as const,
  categories: ["catalog", "categories"] as const,
  brands: ["catalog", "brands"] as const,
  reviews: (productId: string, cursor?: string) => ["catalog", "reviews", productId, cursor] as const,
};

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: catalogKeys.products(filters),
    queryFn: () => getProducts(filters),
  });
}

export function useCategories() {
  return useQuery({queryKey: catalogKeys.categories, queryFn: getCategories, staleTime: 300_000});
}

export function useBrands() {
  return useQuery({queryKey: catalogKeys.brands, queryFn: getBrands, staleTime: 300_000});
}

export function useProductReviews(productId: string, cursor?: string) {
  return useQuery({queryKey: catalogKeys.reviews(productId, cursor), queryFn: () => getProductReviews(productId, cursor), enabled: Boolean(productId)});
}

export function useCreateProductReview() {
  const queryClient = useQueryClient();
  return useMutation({mutationFn: ({productId, request}: {productId: string; request: Parameters<typeof createProductReview>[1]}) => createProductReview(productId, request), onSuccess: (_review, variables) => queryClient.invalidateQueries({queryKey: ["catalog", "reviews", variables.productId]})});
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: catalogKeys.product(slug),
    queryFn: () => getProductBySlug(slug),
    enabled: Boolean(slug),
  });
}
