import {cleanup, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, describe, expect, it, vi} from "vitest";

import {Pagination, pageItems} from "./pagination";

describe("pageItems", () => {
  it("lists every page when there are few", () => {
    expect(pageItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItems(5, 11)).toHaveLength(11);
  });

  it("always shows the first and last four, and two pages on each side of the current one", () => {
    expect(pageItems(1, 109)).toEqual([1, 2, 3, 4, "ellipsis", 106, 107, 108, 109]);
    expect(pageItems(50, 109)).toEqual([1, 2, 3, 4, "ellipsis", 48, 49, 50, 51, 52, "ellipsis", 106, 107, 108, 109]);
    expect(pageItems(5, 109)).toEqual([1, 2, 3, 4, 5, 6, 7, "ellipsis", 106, 107, 108, 109]);
    expect(pageItems(109, 109)).toEqual([1, 2, 3, 4, "ellipsis", 106, 107, 108, 109]);
  });
});

describe("pageItems on a phone", () => {
  it("keeps only the ends and the neighbours of the current page", () => {
    expect(pageItems(1, 109, true)).toEqual([1, 2, 3, 4, "ellipsis", 109]);
    expect(pageItems(50, 109, true)).toEqual([1, "ellipsis", 49, 50, 51, "ellipsis", 109]);
    expect(pageItems(109, 109, true)).toEqual([1, "ellipsis", 106, 107, 108, 109]);
  });
});

describe("Pagination", () => {
  afterEach(cleanup);

  const labels = {previousLabel: "Prev", nextLabel: "Next", pageLabel: (page: number) => `Page ${page}`};

  it("renders nothing for a single page", () => {
    const {container} = render(<Pagination page={1} totalPages={1} onPageChange={() => {}} {...labels} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("marks the current page and moves on click", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} {...labels} />);
    expect(screen.getByRole("button", {name: "Page 2"})).toHaveAttribute("aria-current", "page");
    await userEvent.click(screen.getByRole("button", {name: "Page 4"}));
    await userEvent.click(screen.getByRole("button", {name: "Next"}));
    expect(onPageChange).toHaveBeenNthCalledWith(1, 4);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });

  it("disables previous on the first page and next on the last", () => {
    const {rerender} = render(<Pagination page={1} totalPages={3} onPageChange={() => {}} {...labels} />);
    expect(screen.getByRole("button", {name: "Prev"})).toBeDisabled();
    rerender(<Pagination page={3} totalPages={3} onPageChange={() => {}} {...labels} />);
    expect(screen.getByRole("button", {name: "Next"})).toBeDisabled();
  });
});
