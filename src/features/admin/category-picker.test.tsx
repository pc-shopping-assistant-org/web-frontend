import {cleanup, render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, expect, it, vi} from "vitest";

import type {CategoryTree} from "@/features/catalog/contracts/responses";

import {CategoryPicker} from "./category-picker";

vi.mock("next-intl", () => ({useLocale: () => "vi", useTranslations: () => (key: string) => key}));
vi.mock("@/components/ui/error-message", () => ({ErrorMessage: () => <p role="alert">load failed</p>}));

afterEach(cleanup);

const category = (id: string, name: string, children: CategoryTree[] = []) => ({id, name, children}) as unknown as CategoryTree;
const tree = [category("cpu", "CPU"), category("gpu", "Card đồ họa", [category("nv", "NVIDIA", [category("rtx", "RTX 4070")])])];

function setup(props: Partial<React.ComponentProps<typeof CategoryPicker>> = {}) {
  const onChange = vi.fn();
  render(<CategoryPicker id="cat" value="" onChange={onChange} categories={tree} {...props} />);
  return {onChange, user: userEvent.setup()};
}

it("opens a column per level and confirms a parent as well as a leaf", async () => {
  const {onChange, user} = setup();
  await user.click(screen.getByRole("button", {name: "placeholder"}));
  await user.click(screen.getByRole("button", {name: /Card đồ họa/}));
  await user.click(screen.getByRole("button", {name: /NVIDIA/}));
  expect(screen.getByRole("button", {name: "RTX 4070"})).toBeInTheDocument();
  await user.click(screen.getByRole("button", {name: "confirm"}));
  expect(onChange).toHaveBeenCalledWith("nv");
});

it("finds a category without the accents typed", async () => {
  const {onChange, user} = setup();
  await user.click(screen.getByRole("button", {name: "placeholder"}));
  await user.type(screen.getByRole("textbox", {name: "search"}), "do hoa");
  const results = screen.getAllByRole("button").filter((button) => button.textContent?.includes("Card đồ họa"));
  expect(results.length).toBeGreaterThan(0);
  await user.click(results[0]);
  await user.click(screen.getByRole("button", {name: "confirm"}));
  expect(onChange).toHaveBeenCalledWith("gpu");
});

it("keeps Confirm closed until something is chosen", async () => {
  const {user} = setup();
  await user.click(screen.getByRole("button", {name: "placeholder"}));
  expect(screen.getByRole("button", {name: "confirm"})).toBeDisabled();
});

it("shows the load error instead of empty columns", async () => {
  const {user} = setup({categories: [], error: new Error("boom")});
  await user.click(screen.getByRole("button", {name: "placeholder"}));
  expect(within(screen.getByRole("dialog")).getByRole("alert")).toHaveTextContent("load failed");
  expect(within(screen.getByRole("dialog")).queryAllByRole("list")).toHaveLength(0);
});

it("says there are no categories when the tree is empty", async () => {
  const {user} = setup({categories: []});
  await user.click(screen.getByRole("button", {name: "placeholder"}));
  expect(within(screen.getByRole("dialog")).getByText("empty")).toBeInTheDocument();
});

it("names a category that is no longer in the tree", () => {
  setup({value: "gone", currentLabel: "Old category"});
  expect(screen.getByRole("button", {name: /Old category/})).toBeInTheDocument();
});

it("asks for a category in words only while required and empty", () => {
  setup({required: true});
  expect(screen.getByText("required")).toBeInTheDocument();
  cleanup();
  setup({required: true, value: "cpu"});
  expect(screen.queryByText("required")).not.toBeInTheDocument();
});

it("walks the columns with the arrow keys and takes the first match with Enter", async () => {
  const {onChange, user} = setup();
  await user.click(screen.getByRole("button", {name: "placeholder"}));
  screen.getByRole("button", {name: /Card đồ họa/}).focus();
  await user.keyboard("{ArrowRight}");
  await vi.waitFor(() => expect(screen.getByRole("button", {name: /NVIDIA/})).toHaveFocus());
  await user.keyboard("{ArrowRight}");
  await vi.waitFor(() => expect(screen.getByRole("button", {name: "RTX 4070"})).toHaveFocus());
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByRole("button", {name: /NVIDIA/})).toHaveFocus();
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByRole("button", {name: /Card đồ họa/})).toHaveFocus();
  await user.keyboard("{ArrowUp}");
  expect(screen.getByRole("button", {name: "CPU"})).toHaveFocus();

  await user.click(screen.getByRole("textbox", {name: "search"}));
  await user.keyboard("rtx{Enter}");
  await user.click(screen.getByRole("button", {name: "confirm"}));
  expect(onChange).toHaveBeenCalledWith("rtx");
});
