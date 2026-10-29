import {cleanup, render, screen} from "@testing-library/react";
import {NextIntlClientProvider} from "next-intl";
import {afterEach, expect, it} from "vitest";

import {AssistantMarkdown} from "./assistant-markdown";

afterEach(cleanup);

function Answer({text}: {text: string}) {
  return (
    <NextIntlClientProvider locale="en" messages={{assistant: {answerTable: "AI answer table"}}}>
      <AssistantMarkdown>{text}</AssistantMarkdown>
    </NextIntlClientProvider>
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
