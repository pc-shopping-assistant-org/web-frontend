import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";

import type {ProductSummary} from "@/features/catalog/models";

import {FeaturedProducts} from "./featured-products";

vi.mock("next-intl", () => ({useLocale: () => "en", useTranslations: () => (key: string) => key}));
vi.mock("./product-card", () => ({ProductCard: ({product}: {product: ProductSummary}) => <p>{product.name}</p>}));
afterEach(cleanup);

it("keeps category chips in catalog navigation order rather than product-count order", () => {
  const product = (id: string, categoryId: string): ProductSummary => ({
    id, name: id, seoName: id, categoryId, categoryName: categoryId === "z" ? "Z first" : "A last",
    minPrice: 100, maxPrice: 100, ratingAverage: 0, reviewCount: 0,
  });
  render(<FeaturedProducts
    products={[product("a-1", "a"), product("a-2", "a"), product("z-1", "z")]}
    categories={[{id: "z", name: "Z first", children: []}, {id: "a", name: "A last", children: []}]}
  />);

  expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(["filterAll", "Z first", "A last"]);
});
