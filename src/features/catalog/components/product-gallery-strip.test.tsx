import {cleanup, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, beforeEach, expect, it, vi} from "vitest";

import {ProductGalleryStrip} from "./product-gallery-strip";

vi.mock("next-intl", () => ({useTranslations: () => (key: string) => key}));
vi.mock("next/image", () => ({default: ({alt}: {alt: string}) => <span role="img" aria-label={alt} />}));

const images = Array.from({length: 8}, (_, index) => ({id: `img-${index}`, imageUrl: `https://example.test/${index}.jpg`}));

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollBy = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const renderStrip = (onSelect = vi.fn(), activeId?: string) =>
  render(<ProductGalleryStrip images={images} activeId={activeId} alt="Monitor" onSelect={onSelect} placeholder={<span />} />);

it("lays every image out in one row and reports the one picked", async () => {
  const onSelect = vi.fn();
  renderStrip(onSelect);

  expect(screen.getAllByRole("button", {name: /^viewImage/})).toHaveLength(8);
  await userEvent.setup().click(screen.getByRole("button", {name: "viewImage 3"}));

  expect(onSelect).toHaveBeenCalledWith("img-2");
});

it("marks the active image and scrolls it into view", () => {
  renderStrip(vi.fn(), "img-4");

  expect(screen.getByRole("button", {name: "viewImage 5"})).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", {name: "viewImage 1"})).toHaveAttribute("aria-pressed", "false");
  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
});

it("keeps both arrows on screen and disables the one with nothing further to reach", () => {
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
  renderStrip();

  expect(screen.getByLabelText("previousImages")).toBeDisabled();
  expect(screen.getByLabelText("nextImages")).toBeEnabled();
});

it("disables both arrows when every image already fits", () => {
  renderStrip();

  expect(screen.getByLabelText("previousImages")).toBeDisabled();
  expect(screen.getByLabelText("nextImages")).toBeDisabled();
});

it("pages the strip forward with the next arrow", async () => {
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
  renderStrip();

  await userEvent.setup().click(screen.getByLabelText("nextImages"));

  expect(Element.prototype.scrollBy).toHaveBeenCalledWith({left: 400, behavior: "smooth"});
});
