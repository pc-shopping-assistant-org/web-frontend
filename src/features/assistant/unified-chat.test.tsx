import {render, screen, cleanup, waitFor, act} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, expect, it, vi} from "vitest";
import {AssistantPage} from "./assistant-page";
import {ApiClientError} from "@/lib/api/envelope";
import {AiMode} from "@/lib/domain/assistant-enums";

const profile = vi.hoisted(() => ({data: {id: "user"} as {id: string} | undefined, error: null as unknown}));
vi.mock("@/features/auth/queries", () => ({useProfile: () => profile}));
vi.mock("@/features/auth/login-form", () => ({
  LoginForm: ({onSuccess}: {onSuccess: () => void}) => <button onClick={onSuccess}>testLoginSuccess</button>,
}));

vi.mock("next-intl", () => ({useLocale: () => "vi", useTranslations: () => Object.assign((key: string) => key, {has: () => true})}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({children, href}: {children: React.ReactNode; href: string}) => <a href={href}>{children}</a>,
}));
const pickerProduct = {
  id: "p1",
  name: "RTX 4070 Super",
  seoName: "rtx-4070-super",
  brandName: "ASUS",
  categoryName: "VGA",
  imageUrl: undefined,
  minPrice: 15990000,
  maxPrice: 15990000,
};
const productQueryFilters: Record<string, unknown>[] = [];
vi.mock("@/features/catalog/queries", () => ({
  useProducts: (filters: Record<string, unknown> = {}) => {
    productQueryFilters.push(filters);
    return {data: {items: [pickerProduct]}, isPending: false};
  },
  useProductsByIds: (ids: string[]) => ({
    data: ids.includes("p1") ? [pickerProduct] : [],
    isPending: false,
  }),
}));
vi.mock("./api", () => ({
  streamChat: vi.fn(async () => ({conversation_id: "test", answer: "chat answer", products: []})),
  compare: vi.fn(async () => ({answer: "comparison answer", products: []})),
  evaluate: vi.fn(async () => ({answer: "evaluation answer"})),
}));
import {streamChat, compare, evaluate} from "./api";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  productQueryFilters.length = 0;
  profile.data = {id: "user"};
  profile.error = null;
});

it("renders assistant Markdown while keeping the user's message literal and product cards intact", async () => {
  vi.mocked(streamChat).mockResolvedValueOnce({
    conversation_id: "test", intent: AiMode.Chat, answer: "## Gợi ý\n\nChọn **RAM 32GB**.\n\n- Dễ nâng cấp\n- Đủ bộ nhớ\n\n| RAM | Giá |\n| --- | --- |\n| 32GB | 2 triệu |",
    products: [{id: "p1", name: "RTX 4070 Super", seo_name: "rtx-4070-super", list_price: 15990000, specifications: {}, image_url: "", description: "", status: "ACTIVE"}],
  });
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Giải thích **RAM**" />);
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByRole("heading", {name: "Gợi ý"})).toBeInTheDocument();
  expect(screen.getByText("RAM 32GB").tagName).toBe("STRONG");
  expect(screen.getByRole("table")).toBeInTheDocument();
  expect(screen.getByText("Giải thích **RAM**")).toBeInTheDocument();
  expect(screen.getAllByText("RTX 4070 Super").some((element) => element.tagName === "P")).toBe(true);
  expect(screen.getByRole("link", {name: "viewProduct"})).toHaveAttribute("href", "/products/rtx-4070-super");
});

it("uses the same Markdown rendering while streaming without unlocking the composer", async () => {
  let finish!: (value: Awaited<ReturnType<typeof streamChat>>) => void;
  vi.mocked(streamChat).mockImplementationOnce(async (_message, _conversation, handlers) => {
    handlers?.onDelta?.("### Đang phân tích\n\nƯu tiên **di động**.");
    return new Promise((resolve) => {finish = resolve;});
  });
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Laptop mỏng nhẹ" />);
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByRole("heading", {name: "Đang phân tích"})).toBeInTheDocument();
  expect(screen.getByText("di động").tagName).toBe("STRONG");
  expect(screen.getByRole("textbox", {name: "promptLabel"})).toBeDisabled();
  await act(async () => finish({conversation_id: "test", intent: AiMode.Chat, answer: "## Hoàn tất\n\nChọn **mỏng nhẹ**.", products: []}));
  expect(await screen.findByRole("heading", {name: "Hoàn tất"})).toBeInTheDocument();
  expect(screen.queryByRole("heading", {name: "Đang phân tích"})).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", {name: "promptLabel"})).toBeEnabled();
});

it("shows selected product details as a catalog link instead of exposing its UUID", async () => {
  const user = userEvent.setup();
  render(<AssistantPage initialProductIds={["p1"]} />);

  expect(screen.queryByText("p1")).not.toBeInTheDocument();
  const productLinks = screen.getAllByRole("link", {name: /RTX 4070 Super/});
  expect(productLinks.some((link) => link.getAttribute("href") === "/products/rtx-4070-super")).toBe(true);

  await user.type(screen.getByRole("textbox", {name: "searchCatalogProducts"}), "rtx");
  await waitFor(() => expect(productQueryFilters.some((filters) => filters.keyword === "rtx")).toBe(true));
});

it("lets guests draft and select products, then prompts sign-in without calling AI or losing the draft", async () => {
  profile.data = undefined;
  profile.error = new ApiClientError(401, "UNAUTHENTICATED");
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Tư vấn RAM" initialProductIds={["a"]} />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByRole("dialog", {name: "signInTitle"})).toBeInTheDocument();
  expect(streamChat).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", {name: "signInClose"}));
  expect(screen.getByRole("textbox", {name: "promptLabel"})).toHaveValue("Tư vấn RAM");
  await user.click(screen.getByRole("button", {name: /send/}));
  profile.data = {id: "user"};
  profile.error = null;
  await user.click(screen.getByRole("button", {name: "testLoginSuccess"}));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(streamChat).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByText("chat answer")).toBeInTheDocument();
  expect(streamChat).toHaveBeenCalledWith("Tư vấn RAM", undefined, expect.any(Object), expect.any(AbortSignal), {
    selectedProductIds: ["a"],
  });
});

it("turns an AI 401 into a sign-in dialog rather than a generic error", async () => {
  vi.mocked(streamChat).mockRejectedValueOnce(new ApiClientError(401, "AI_UNAUTHENTICATED"));
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Build 25 triệu" />);
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByRole("dialog", {name: "signInTitle"})).toBeInTheDocument();
  expect(screen.getByRole("textbox", {name: "promptLabel"})).toHaveValue("Build 25 triệu");
  expect(screen.queryByText("AI_UNAUTHENTICATED")).not.toBeInTheDocument();
});

it("prefills the build question without auto-sending or attaching mock product IDs", async () => {
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Đánh giá cấu hình DEMO của tôi" />);
  expect(screen.getByRole("textbox", {name: "promptLabel"})).toHaveValue("Đánh giá cấu hình DEMO của tôi");
  expect(streamChat).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", {name: /send/}));
  await screen.findByText("chat answer");
  expect(streamChat).toHaveBeenCalledWith("Đánh giá cấu hình DEMO của tôi", undefined, expect.any(Object), expect.any(AbortSignal), {
    selectedProductIds: [],
  });
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
  expect(streamChat).toHaveBeenCalledWith("Laptop cho lập trình", undefined, expect.any(Object), expect.any(AbortSignal), {
    selectedProductIds: [],
  });
});
it("sends an attached product to the same stateful chat runtime", async () => {
  const user = userEvent.setup();
  render(<AssistantPage initialProductIds={["a"]} />);
  await user.type(screen.getByRole("textbox", {name: "promptLabel"}), "Giải thích ưu điểm");
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByText("chat answer")).toBeInTheDocument();
  expect(streamChat).toHaveBeenCalledWith("Giải thích ưu điểm", undefined, expect.any(Object), expect.any(AbortSignal), {
    selectedProductIds: ["a"],
  });
  expect(evaluate).not.toHaveBeenCalled();
});
it("uses the comparison adapter without a separate compare page", async () => {
  const user = userEvent.setup();
  render(<AssistantPage initialProductIds={["a", "b"]} />);
  await user.type(screen.getByRole("textbox", {name: "promptLabel"}), "So sánh hai mẫu");
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByText("chat answer")).toBeInTheDocument();
  expect(streamChat).toHaveBeenCalledWith("So sánh hai mẫu", undefined, expect.any(Object), expect.any(AbortSignal), {
    selectedProductIds: ["a", "b"],
  });
  expect(compare).not.toHaveBeenCalled();
});
