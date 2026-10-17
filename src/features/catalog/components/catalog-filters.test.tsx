import {cleanup, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, expect, it, vi} from "vitest";

import type {CategoryTree} from "@/features/catalog/contracts/responses";

import {CatalogFilters, categoryOptions, type FilterOption} from "./catalog-filters";

vi.mock("next-intl", () => ({useLocale: () => "vi", useTranslations: () => (key: string) => key}));

afterEach(cleanup);

const node = (id: string, name: string, children: CategoryTree[] = []) => ({id, name, children}) as unknown as CategoryTree;
const many = (count: number): FilterOption[] => Array.from({length: count}, (_, index) => ({value: `c${index}`, label: `Category ${index}`}));

function setup(props: Partial<React.ComponentProps<typeof CatalogFilters>> = {}) {
  const handlers = {onCategory: vi.fn(), onBrand: vi.fn(), onPrice: vi.fn(), onClear: vi.fn()};
  render(
    <CatalogFilters
      categories={[{value: "cpu", label: "CPU"}, {value: "gpu", label: "GPU"}]}
      brands={[{value: "asus", label: "Asus"}]}
      loading={false}
      {...handlers}
      {...props}
    />,
  );
  return {...handlers, user: userEvent.setup()};
}

it("lists the categories as a tree, each level indented one step deeper", () => {
  const options = categoryOptions([node("a", "Components", [node("b", "Memory", [node("c", "DDR5")])]), node("d", "Laptops")]);

  expect(options.map((option) => [option.label, option.depth])).toEqual([["Components", 0], ["Memory", 1], ["DDR5", 2], ["Laptops", 0]]);
});

it("applies a category or a brand as soon as it is picked, and clears it with the first option", async () => {
  const {onCategory, onBrand, user} = setup({categoryId: "cpu"});

  await user.click(screen.getByRole("radio", {name: "GPU"}));
  await user.click(screen.getByRole("radio", {name: "Asus"}));
  await user.click(screen.getByRole("radio", {name: "allCategories"}));

  expect(onCategory).toHaveBeenNthCalledWith(1, "gpu");
  expect(onBrand).toHaveBeenCalledWith("asus");
  expect(onCategory).toHaveBeenNthCalledWith(2, undefined);
});

it("marks the chosen option and nothing else", () => {
  setup({categoryId: "gpu"});

  expect(screen.getByRole("radio", {name: "GPU"})).toBeChecked();
  expect(screen.getByRole("radio", {name: "CPU"})).not.toBeChecked();
  expect(screen.getByRole("radio", {name: "allBrands"})).toBeChecked();
});

it("folds a long list behind a more button and unfolds it", async () => {
  const {user} = setup({categories: many(12)});

  expect(screen.queryByRole("radio", {name: "Category 11"})).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", {name: "showMore"}));

  expect(screen.getByRole("radio", {name: "Category 11"})).toBeInTheDocument();
  expect(screen.getByRole("button", {name: "showLess"})).toHaveAttribute("aria-expanded", "true");
});

it("keeps a chosen option from below the fold visible", () => {
  setup({categories: many(12), categoryId: "c11"});

  expect(screen.getByRole("radio", {name: "Category 11"})).toBeChecked();
  expect(screen.queryByRole("button", {name: "showMore"})).not.toBeInTheDocument();
});

it("applies the price range only with its button, and refuses one that ends before it starts", async () => {
  const {onPrice, user} = setup();
  const from = screen.getByRole("spinbutton", {name: "minPrice"});
  const to = screen.getByRole("spinbutton", {name: "maxPrice"});

  await user.type(from, "900");
  await user.type(to, "100");
  await user.click(screen.getByRole("button", {name: "applyPrice"}));
  expect(onPrice).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("invalidPriceRange");

  await user.clear(from);
  await user.type(from, "50");
  await user.click(screen.getByRole("button", {name: "applyPrice"}));
  expect(onPrice).toHaveBeenCalledWith({minPrice: 50, maxPrice: 100});
});

it("shows loading rows instead of the lists while the categories load", () => {
  setup({loading: true});

  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
});

it("offers to clear the filters only when something is set", () => {
  setup({onClear: undefined});

  expect(screen.queryByRole("button", {name: "clearFilters"})).not.toBeInTheDocument();
});

const tree = categoryOptions([node("pc", "PC parts", [node("ram", "Memory", [node("ddr5", "DDR5")]), node("cpu", "Processors")]), node("lap", "Laptops")]);

it("starts with the sub-categories folded behind their parent", () => {
  setup({categories: tree});

  expect(screen.getByRole("radio", {name: "PC parts"})).toBeInTheDocument();
  expect(screen.getByRole("radio", {name: "Laptops"})).toBeInTheDocument();
  expect(screen.queryByRole("radio", {name: "Memory"})).not.toBeInTheDocument();
});

it("opens and folds a parent with its arrow without choosing it", async () => {
  const {onCategory, user} = setup({categories: tree});

  await user.click(screen.getByRole("button", {name: "expandChildren"}));
  expect(screen.getByRole("radio", {name: "Memory"})).toBeInTheDocument();
  expect(screen.getByRole("radio", {name: "Processors"})).toBeInTheDocument();
  expect(screen.queryByRole("radio", {name: "DDR5"})).not.toBeInTheDocument();

  await user.click(screen.getAllByRole("button", {name: "collapseChildren"})[0]);
  expect(screen.queryByRole("radio", {name: "Memory"})).not.toBeInTheDocument();
  expect(onCategory).not.toHaveBeenCalled();
});

it("opens a parent as it is chosen, so its children can narrow the choice", async () => {
  const {onCategory, user} = setup({categories: tree});

  await user.click(screen.getByRole("radio", {name: "PC parts"}));

  expect(onCategory).toHaveBeenCalledWith("pc");
  expect(screen.getByRole("radio", {name: "Memory"})).toBeInTheDocument();
});

it("opens the parents above a chosen sub-category at first", () => {
  setup({categories: tree, categoryId: "ddr5"});

  expect(screen.getByRole("radio", {name: "DDR5"})).toBeChecked();
  expect(screen.getByRole("radio", {name: "Memory"})).toBeInTheDocument();
});
