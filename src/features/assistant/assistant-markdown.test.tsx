import {cleanup, render, screen} from "@testing-library/react";
import {NextIntlClientProvider} from "next-intl";
import {afterEach, expect, it, vi} from "vitest";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import {AssistantMarkdown} from "./assistant-markdown";
import {AssistantProductCarousel} from "./components/assistant-product-carousel";
import type {AssistantProduct} from "./models";

vi.mock("@/i18n/navigation", () => ({
  Link: ({children, href, className}: {children: React.ReactNode; href: string; className?: string}) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

afterEach(cleanup);

const testQueryClient = new QueryClient({defaultOptions: {queries: {retry: false}, mutations: {retry: false}}});

function Answer({text, products}: {text: string; products?: AssistantProduct[]}) {
  return (
    <QueryClientProvider client={testQueryClient}>
      <NextIntlClientProvider locale="en" messages={{assistant: {answerTable: "AI answer table", viewProduct: "View product", relatedProducts: "Related products", scrollLeft: "Scroll left", scrollRight: "Scroll right", askAboutProduct: "Ask"}, catalog: {quickAdd: "Add", productDetails: "Details", addingToCart: "Adding"}, common: {saved: "Saved"}}}>
        <AssistantMarkdown products={products}>{text}</AssistantMarkdown>
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

it("renders common Markdown and GFM tables with contained code and source links", () => {
  const {container} = render(<Answer text={[
    "## Recommended build", "", "Use **32GB RAM** and `DDR5`.", "",
    "- Gaming", "- Work", "", "1. Choose CPU", "2. Choose GPU", "",
    "> Check compatibility first.", "",
    "| Part | Price |", "| --- | --- |", "| RAM | 2000000 VND |", "",
    "```json", '{"ram":32}', "```", "",
    "[Specs](https://example.com/specs)",
  ].join("\n")} />);

  expect(screen.getByRole("heading", {name: "Recommended build"})).toBeInTheDocument();
  expect(screen.getByText("32GB RAM").tagName).toBe("STRONG");
  expect(container.querySelector("ul")).not.toBeNull();
  expect(container.querySelector("ol")).not.toBeNull();
  expect(container.querySelector("blockquote")).not.toBeNull();
  expect(screen.getByRole("region", {name: "AI answer table"})).toContainElement(screen.getByRole("table"));
  expect(container.querySelector("pre > code")).toHaveTextContent('{"ram":32}');
  expect(screen.getByRole("link", {name: "Specs"})).toHaveAttribute("target", "_blank");
  expect(screen.getByRole("link", {name: "Specs"})).toHaveAttribute("rel", "noopener noreferrer");
});

it("does not execute model HTML, expose unsafe links or load model-supplied images", () => {
  const {container} = render(<Answer text={[
    '<script>alert("bad")</script>', "",
    '<iframe src="https://example.com/embed"></iframe>', "",
    '[Unsafe](javascript:alert%281%29)', "",
    '![GPU image](https://example.com/tracker.png)', "",
    '[Product](/vi/products/ram)',
  ].join("\n")} />);

  expect(container.querySelector("script, iframe, img")).toBeNull();
  expect(screen.queryByRole("link", {name: "Unsafe"})).not.toBeInTheDocument();
  expect(screen.getByText("GPU image")).toBeInTheDocument();
  expect(screen.getByRole("link", {name: "Product"})).toHaveAttribute("href", "/vi/products/ram");
  expect(screen.getByRole("link", {name: "Product"})).not.toHaveAttribute("target");
});

it("handles an unfinished streamed code fence and renders the completed answer on update", () => {
  const {container, rerender} = render(<Answer text={'**Budget**\n\n```json\n{"budget":25'} />);
  expect(screen.getByText("Budget").tagName).toBe("STRONG");
  expect(container.querySelector("pre > code")).toHaveTextContent('{"budget":25');
  rerender(<Answer text={'**Budget**\n\n```json\n{"budget":25000000}\n```\n\nReady.'} />);
  expect(container.querySelector("pre > code")).toHaveTextContent('{"budget":25000000}');
  expect(screen.getByText("Ready.")).toBeInTheDocument();
});

it("links mentioned catalog products inline in prose without altering code blocks or headings", () => {
  const products: AssistantProduct[] = [
    {id: "p1", name: "HyperX Cloud III", seo_name: "hyperx-cloud-iii", list_price: 2190000, specifications: {}},
  ];
  const {container} = render(
    <Answer
      products={products}
      text={"## HyperX Cloud III\n\nBạn nên chọn **HyperX Cloud III** cho FPS.\n\n`HyperX Cloud III`"}
    />,
  );
  const links = screen.getAllByRole("link", {name: "HyperX Cloud III"});
  expect(links).toHaveLength(1);
  expect(links[0]).toHaveAttribute("href", "/products/hyperx-cloud-iii");
  expect(links[0]).not.toHaveAttribute("target");
  expect(container.querySelector("[data-product-cards]")).toBeNull();
});

it("renders multiple products in a standalone horizontal carousel with navigation buttons", () => {
  const products: AssistantProduct[] = [
    {id: "p1", name: "HyperX Cloud III", seo_name: "hyperx-cloud-iii", list_price: 2190000, specifications: {}},
    {id: "p2", name: "Logitech G Pro X", seo_name: "logitech-g-pro-x", list_price: 2990000, specifications: {}},
  ];
  const {container} = render(
    <QueryClientProvider client={testQueryClient}>
      <NextIntlClientProvider locale="en" messages={{assistant: {answerTable: "AI answer table", viewProduct: "View product", relatedProducts: "Related products", scrollLeft: "Scroll left", scrollRight: "Scroll right", askAboutProduct: "Ask"}, catalog: {quickAdd: "Add", productDetails: "Details", addingToCart: "Adding"}, common: {saved: "Saved"}}}>
        <AssistantProductCarousel products={products} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
  expect(container.querySelectorAll("[data-product-cards]")).toHaveLength(1);
  expect(container.querySelectorAll("[data-product-card]")).toHaveLength(2);
  expect(screen.getByText("Related products (2)")).toBeInTheDocument();
  expect(screen.getByRole("button", {name: "Scroll left"})).toBeInTheDocument();
  expect(screen.getByRole("button", {name: "Scroll right"})).toBeInTheDocument();
});
