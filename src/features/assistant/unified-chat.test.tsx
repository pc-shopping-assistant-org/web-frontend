import {render, screen, cleanup} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, expect, it, vi} from "vitest";
import {AssistantPage} from "./assistant-page";

vi.mock("next-intl", () => ({useLocale: () => "vi", useTranslations: () => (key: string) => key}));
vi.mock("@/i18n/navigation", () => ({Link: ({children, href}: {children: React.ReactNode; href: string}) => <a href={href}>{children}</a>}));
vi.mock("@/features/catalog/queries", () => ({useProducts: () => ({data: {items: []}, isPending: false})}));
vi.mock("./api", () => ({
  streamChat: vi.fn(async () => ({conversation_id: "test", answer: "chat answer", products: []})),
  compare: vi.fn(async () => ({answer: "comparison answer", products: []})),
  evaluate: vi.fn(async () => ({answer: "evaluation answer"})),
}));
import {streamChat, compare, evaluate} from "./api";
afterEach(() => {cleanup(); vi.clearAllMocks();});

it("prefills the build question without auto-sending or attaching mock product IDs", async () => {
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Đánh giá cấu hình DEMO của tôi" />);
  expect(screen.getByRole("textbox", {name: "promptLabel"})).toHaveValue("Đánh giá cấu hình DEMO của tôi");
  expect(streamChat).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", {name: /send/}));
  await screen.findByText("chat answer");
  expect(streamChat).toHaveBeenCalledWith("Đánh giá cấu hình DEMO của tôi", undefined, expect.any(Object), expect.any(AbortSignal));
  expect(evaluate).not.toHaveBeenCalled();
  expect(compare).not.toHaveBeenCalled();
});

it("offers one chat without workflow navigation and keeps conversation history", async () => {
  const user = userEvent.setup();
  render(<AssistantPage />);
  expect(screen.queryByText("chooseWorkflow")).not.toBeInTheDocument();
  await user.type(screen.getByRole("textbox", {name: "promptLabel"}), "Laptop cho lập trình");
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByText("chat answer")).toBeInTheDocument();
  expect(streamChat).toHaveBeenCalledWith("Laptop cho lập trình", undefined, expect.any(Object), expect.any(AbortSignal));
});
it("uses the evaluation adapter for an attached product inside the same conversation", async () => {
  const user = userEvent.setup();
  render(<AssistantPage initialProductIds={["a"]} />);
  await user.type(screen.getByRole("textbox", {name: "promptLabel"}), "Giải thích ưu điểm");
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByText("evaluation answer")).toBeInTheDocument();
  expect(evaluate).toHaveBeenCalledWith("a", "Giải thích ưu điểm");
});
it("uses the comparison adapter without a separate compare page", async () => {
  const user = userEvent.setup();
  render(<AssistantPage initialProductIds={["a", "b"]} />);
  await user.type(screen.getByRole("textbox", {name: "promptLabel"}), "So sánh hai mẫu");
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByText("comparison answer")).toBeInTheDocument();
  expect(compare).toHaveBeenCalledWith(["a", "b"], "So sánh hai mẫu");
});
