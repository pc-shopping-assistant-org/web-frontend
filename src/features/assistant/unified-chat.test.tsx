import {render as rtlRender, screen, cleanup, waitFor, act} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, expect, it, vi} from "vitest";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {AssistantPage} from "./assistant-page";
import {ApiClientError} from "@/lib/api/envelope";
import {AgentActivityStage, AiMode, AssistantTaskKind, ChatStreamEventType, ThinkingMode} from "@/lib/domain/assistant-enums";
import {loadConversationHistory} from "./conversation-history";
import {cancelRun, waitForRunResult} from "./stateful-api";
import {getProductById} from "@/features/catalog/api";

function render(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}, mutations: {retry: false}},
  });
  return rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

vi.mock("./conversation-history", () => ({loadConversationHistory: vi.fn(), setConversationUrl: vi.fn()}));
vi.mock("./stateful-api", () => ({waitForRunResult: vi.fn(), cancelRun: vi.fn(async () => undefined)}));

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
vi.mock("@/features/cart/queries", () => ({
  useAddToCart: () => ({mutateAsync: vi.fn(), isPending: false}),
}));
vi.mock("@/features/catalog/api", () => ({getProductById: vi.fn(), getProductBySlug: vi.fn()}));
vi.mock("./api", () => ({
  getAssistantModels: vi.fn(async () => null),
  streamChat: vi.fn(async () => ({conversation_id: "test", answer: "chat answer", products: []})),
  compare: vi.fn(async () => ({answer: "comparison answer", products: []})),
  evaluate: vi.fn(async () => ({answer: "evaluation answer"})),
}));
import {getAssistantModels, streamChat, compare, evaluate} from "./api";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
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

it("restores URL conversation history on reload and continues using its original identity", async () => {
  vi.mocked(loadConversationHistory).mockResolvedValueOnce({turns: [{prompt: "Laptop?", response: {
    conversation_id: "saved", intent: AiMode.Chat, answer: "**Budget?**", products: [],
  }}], pendingRunId: undefined});
  const user = userEvent.setup();
  render(<AssistantPage initialConversationId="saved" />);
  expect(await screen.findByText("Budget?")).toBeInTheDocument();
  expect(streamChat).not.toHaveBeenCalled();
  await user.type(screen.getByRole("textbox", {name: "promptLabel"}), "25 triệu");
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(streamChat).toHaveBeenCalledWith("25 triệu", "saved", expect.any(Object), expect.any(AbortSignal), {selectedProductIds: []});
});

it("compares V2 product cards without inventing availability when task kind is COMPARE", async () => {
  vi.mocked(streamChat).mockResolvedValueOnce({
    conversation_id: "test", intent: AiMode.Chat, answer: "So sánh từ catalog",
    products: [
      {id: "p1", name: "GPU A", specifications: {memory_gb: 8}},
      {id: "p2", name: "GPU B", specifications: {memory_gb: 12}},
    ],
    stateful: {
      revision: 1,
      taskKinds: [AssistantTaskKind.Compare],
      proposal: null,
      clarificationOptions: [],
      build: null,
    },
  });
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="So sánh hai GPU" />);
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByRole("table", {name: "comparisonTable"})).toBeInTheDocument();
  expect(screen.queryByText("inStock")).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", {name: "productDetails"})).toHaveLength(2);
});

it("does not render a comparison table for normal multi-product search answers", async () => {
  vi.mocked(streamChat).mockResolvedValueOnce({
    conversation_id: "test", intent: AiMode.Chat, answer: "Gợi ý 2 mẫu GPU phù hợp nhu cầu chơi game 2K.",
    products: [
      {id: "p1", name: "GPU A", specifications: {memory_gb: 8}},
      {id: "p2", name: "GPU B", specifications: {memory_gb: 12}},
    ],
    stateful: {
      revision: 1,
      taskKinds: [AssistantTaskKind.Answer],
      proposal: null,
      clarificationOptions: [],
      build: null,
    },
  });
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Gợi ý GPU chơi game 2K" />);
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByText("Gợi ý 2 mẫu GPU phù hợp nhu cầu chơi game 2K.")).toBeInTheDocument();
  expect(screen.queryByRole("table", {name: "comparisonTable"})).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", {name: "productDetails"})).toHaveLength(2);
});

it("hides duplicate product cards that are already listed inside PcBuildSummary", async () => {
  vi.mocked(streamChat).mockResolvedValueOnce({
    conversation_id: "test", intent: AiMode.Chat, answer: "Cấu hình tối ưu cho ngân sách 25 triệu.",
    products: [
      {id: "p1", name: "Ryzen 5 7600", specifications: {}},
      {id: "p2", name: "RTX 4070 Super", specifications: {}},
    ],
    stateful: {
      revision: 1,
      taskKinds: [AssistantTaskKind.Build],
      proposal: null,
      clarificationOptions: [],
      build: {
        totalSpending: 24500000,
        stale: false,
        parts: [
          {slot: "CPU", name: "Ryzen 5 7600", variantId: "v1", spending: 5500000, owned: false, pinned: false},
          {slot: "GPU", name: "RTX 4070 Super", variantId: "v2", spending: 19000000, owned: false, pinned: false},
        ],
      },
    },
  });
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Build PC 25 triệu" />);
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByText("Cấu hình tối ưu cho ngân sách 25 triệu.")).toBeInTheDocument();
  expect(screen.queryByRole("button", {name: "productDetails"})).not.toBeInTheDocument();
});

it("shows a readable error when product quick view cannot load catalog details", async () => {
  vi.mocked(streamChat).mockResolvedValueOnce({
    conversation_id: "test", intent: AiMode.Chat, answer: "Catalog product",
    products: [{id: "p1", name: "GPU", specifications: {}}],
  });
  vi.mocked(getProductById).mockRejectedValueOnce(new ApiClientError(503, "SERVICE_UNAVAILABLE"));
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Giải thích GPU" />);
  await user.click(screen.getByRole("button", {name: /send/}));
  await user.click(await screen.findByRole("button", {name: "productDetails"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("SERVICE_UNAVAILABLE");
});

it("waits for an already admitted run after reload instead of unlocking or resubmitting", async () => {
  vi.mocked(loadConversationHistory).mockResolvedValueOnce({turns: [{runId: "pending", prompt: "Lập trình backend"}], pendingRunId: "pending"});
  let complete!: (value: Awaited<ReturnType<typeof waitForRunResult>>) => void;
  vi.mocked(waitForRunResult).mockImplementationOnce(() => new Promise((resolve) => {complete = resolve;}));
  render(<AssistantPage initialConversationId="saved" />);
  expect(await screen.findByText("Lập trình backend")).toBeInTheDocument();
  expect(screen.getByRole("textbox", {name: "promptLabel"})).toBeDisabled();
  expect(streamChat).not.toHaveBeenCalled();
  await act(async () => complete({conversation_id: "saved", intent: AiMode.Chat, answer: "Chọn máy gọn nhẹ", products: []}));
  expect(await screen.findByText("Chọn máy gọn nhẹ")).toBeInTheDocument();
  expect(screen.getByRole("textbox", {name: "promptLabel"})).toBeEnabled();
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

  await user.click(screen.getByRole("button", {name: "addToChat"}));
  await user.click(screen.getByRole("button", {name: /attachProducts/}));
  await user.type(screen.getByRole("textbox", {name: "searchCatalogProducts"}), "rtx");
  await waitFor(() => expect(productQueryFilters.some((filters) => filters.keyword === "rtx")).toBe(true));
});

it("keeps submitted product attachments visible after the composer selection clears", async () => {
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Giải thích sản phẩm đã chọn" initialProductIds={["p1"]} />);
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByText("chat answer")).toBeInTheDocument();
  expect(screen.getByRole("link", {name: pickerProduct.name}))
    .toHaveAttribute("href", "/products/rtx-4070-super");
  expect(screen.queryByRole("button", {name: `removeProduct: ${pickerProduct.name}`})).not.toBeInTheDocument();
});

it("restores product attachments with their original user message from history", async () => {
  const savedTurn = {
    prompt: "Đánh giá sản phẩm tôi đính kèm",
    selectedProductIds: ["p1"],
    response: {conversation_id: "saved", intent: AiMode.Chat, answer: "Phản hồi đã lưu", products: []},
  };
  vi.mocked(loadConversationHistory).mockResolvedValueOnce({turns: [savedTurn], pendingRunId: undefined});
  render(<AssistantPage initialConversationId="saved" />);
  expect(await screen.findByText("Phản hồi đã lưu")).toBeInTheDocument();
  expect(screen.getByRole("link", {name: pickerProduct.name}))
    .toHaveAttribute("href", "/products/rtx-4070-super");
  expect(streamChat).not.toHaveBeenCalled();
});

it("links a mentioned catalog product inline between paragraphs and renders its card in the bottom shelf", async () => {
  vi.mocked(streamChat).mockResolvedValueOnce({
    conversation_id: "test", intent: AiMode.Chat,
    answer: "Một lựa chọn phù hợp:\n\n**RTX 4070 Super**\n\nNếu cần di chuyển, hãy cân nhắc thêm trọng lượng.",
    products: [{id: "p1", name: pickerProduct.name, seo_name: pickerProduct.seoName,
      list_price: pickerProduct.minPrice, specifications: {}}],
  });
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Gợi ý sản phẩm phù hợp" />);
  await user.click(screen.getByRole("button", {name: /send/}));
  const before = await screen.findByText("Một lựa chọn phù hợp:");
  const after = screen.getByText("Nếu cần di chuyển, hãy cân nhắc thêm trọng lượng.");
  const inlineLink = screen.getByRole("link", {name: pickerProduct.name});
  const cardLink = screen.getByRole("link", {name: "viewProduct"});
  expect(before.compareDocumentPosition(inlineLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(inlineLink.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(after.compareDocumentPosition(cardLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("shows successive text chunks immediately and replaces the draft with the final validated answer", async () => {
  let handlers!: Parameters<typeof streamChat>[2];
  let finish!: (value: Awaited<ReturnType<typeof streamChat>>) => void;
  vi.mocked(streamChat).mockImplementationOnce(async (_message, _conversation, nextHandlers) => {
    handlers = nextHandlers;
    return new Promise((resolve) => {finish = resolve;});
  });
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Tư vấn laptop" />);
  await user.click(screen.getByRole("button", {name: /send/}));
  await act(async () => handlers?.onDelta?.("Đề xuất "));
  expect(screen.getByText("Đề xuất")).toBeInTheDocument();
  expect(screen.getByRole("textbox", {name: "promptLabel"})).toBeDisabled();
  await act(async () => handlers?.onDelta?.("**RAM 32GB**."));
  expect(screen.getByText("RAM 32GB").tagName).toBe("STRONG");
  await act(async () => finish({conversation_id: "test", intent: AiMode.Chat,
    answer: "## Kết quả xác thực\n\nThông tin từ catalog.", products: []}));
  expect(await screen.findByRole("heading", {name: "Kết quả xác thực"})).toBeInTheDocument();
  expect(screen.queryByText("RAM 32GB")).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", {name: "promptLabel"})).toBeEnabled();
});

it("retrieves an interrupted delivery from the same run without resending the question", async () => {
  vi.mocked(streamChat).mockImplementationOnce(async (_message, _conversation, handlers) => {
    handlers?.onRunAdmitted?.("saved", "same-run");
    handlers?.onReconnecting?.();
    return new Promise(() => {});
  });
  vi.mocked(waitForRunResult).mockResolvedValueOnce({conversation_id: "saved", intent: AiMode.Chat, answer: "Recovered result", products: []});
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Tư vấn GPU" initialProductIds={["p1"]} />);
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByText("recoveringDescription")).toBeInTheDocument();
  await user.click(screen.getByRole("button", {name: "checkResult"}));
  expect(await screen.findByText("Recovered result")).toBeInTheDocument();
  expect(waitForRunResult).toHaveBeenCalledWith("saved", "same-run", expect.any(AbortSignal));
  expect(streamChat).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("textbox", {name: "promptLabel"})).toBeEnabled();
});

it("distinguishes a model timeout and retries with the original attachment", async () => {
  vi.mocked(streamChat).mockRejectedValueOnce(new ApiClientError(502, "AI_RUN_FAILED", [{code: "MODEL_TIMEOUT"}]));
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Giải thích GPU" initialProductIds={["p1"]} />);
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByText("modelTimeout")).toBeInTheDocument();
  expect(screen.queryByText("connectionFailed")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", {name: "retry"}));
  expect(await screen.findByText("chat answer")).toBeInTheDocument();
  expect(streamChat).toHaveBeenLastCalledWith("Giải thích GPU", undefined, expect.any(Object), expect.any(AbortSignal), {selectedProductIds: ["p1"]});
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

it("shows a reconnecting status while the interrupted stream falls back to the saved result", async () => {
  let finish!: (value: Awaited<ReturnType<typeof streamChat>>) => void;
  vi.mocked(streamChat).mockImplementationOnce(async (_message, _conversation, handlers) => {
    handlers?.onDelta?.("Đang phân tích");
    handlers?.onReconnecting?.();
    return new Promise((resolve) => {finish = resolve;});
  });
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Laptop mỏng nhẹ" />);
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByRole("status")).toHaveTextContent("reconnecting");
  expect(screen.getByText("Đang phân tích")).toBeInTheDocument();
  await act(async () => finish({conversation_id: "test", intent: AiMode.Chat, answer: "Hoàn tất", products: []}));
  expect(await screen.findByText("Hoàn tất")).toBeInTheDocument();
  expect(screen.queryByText("reconnecting")).not.toBeInTheDocument();
});

it("keeps a failed stream inline with its partial answer and retries the same prompt", async () => {
  vi.mocked(streamChat).mockImplementationOnce(async (_message, _conversation, handlers) => {
    handlers?.onDelta?.("Phần trả lời dở dang");
    throw new ApiClientError(502, "AI_CHAT_STREAM_FAILED");
  });
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Build 25 triệu" />);
  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByText("connectionFailed")).toBeInTheDocument();
  expect(screen.getByText("Phần trả lời dở dang")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("networkFailed");
  expect(screen.getByRole("textbox", {name: "promptLabel"})).toBeEnabled();
  await user.click(screen.getByRole("button", {name: "retry"}));
  expect(await screen.findByText("chat answer")).toBeInTheDocument();
  expect(streamChat).toHaveBeenLastCalledWith("Build 25 triệu", undefined, expect.any(Object), expect.any(AbortSignal), {selectedProductIds: []});
  expect(screen.queryByText("connectionFailed")).not.toBeInTheDocument();
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

it("lets users switch models and thinking modes from the YAML catalog and sends them with the turn", async () => {
  vi.mocked(getAssistantModels).mockResolvedValueOnce({
    default_model_id: "gemini-2.5-flash",
    models: [
      {
        id: "gemini-2.5-flash",
        label: "Gemini 2.5 Flash",
        provider: "gemini",
        supported_thinking_modes: [ThinkingMode.Off, ThinkingMode.Low, ThinkingMode.High],
        default_thinking_mode: ThinkingMode.Low,
        is_default: true,
      },
      {
        id: "qwen3.5-ollama",
        label: "Qwen 3.5 9B (Ollama)",
        provider: "openai",
        supported_thinking_modes: [ThinkingMode.Off, ThinkingMode.On],
        default_thinking_mode: ThinkingMode.On,
        is_default: false,
      },
    ],
  });
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Tư vấn GPU 2K" />);
  const modelButton = await screen.findByRole("button", {name: "selectModel"});
  expect(modelButton).toHaveTextContent("Gemini 2.5 Flash");

  await user.click(modelButton);
  await user.click(await screen.findByRole("button", {name: "Qwen 3.5 9B (Ollama)"}));
  expect(screen.getByRole("button", {name: "selectModel"})).toHaveTextContent("Qwen 3.5 9B (Ollama)");

  const thinkingButton = screen.getByRole("button", {name: "selectThinking"});
  await user.click(thinkingButton);
  await user.click(await screen.findByRole("button", {name: "thinkingModes.off"}));

  await user.click(screen.getByRole("button", {name: /send/}));
  expect(await screen.findByText("chat answer")).toBeInTheDocument();
  expect(streamChat).toHaveBeenCalledWith("Tư vấn GPU 2K", undefined, expect.any(Object), expect.any(AbortSignal), {
    selectedProductIds: [],
    modelId: "qwen3.5-ollama",
    thinkingMode: ThinkingMode.Off,
  });
});

it("displays live agent activity steps while streaming and clears them on completion", async () => {
  let handlers!: Parameters<typeof streamChat>[2];
  let finish!: (value: Awaited<ReturnType<typeof streamChat>>) => void;
  vi.mocked(streamChat).mockImplementationOnce(async (_message, _conversation, nextHandlers) => {
    handlers = nextHandlers;
    return new Promise((resolve) => {finish = resolve;});
  });
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Tìm VGA 2K" />);
  await user.click(screen.getByRole("button", {name: /send/}));
  await act(async () => {
    handlers?.onStatus?.({
      conversation_id: "00000000-0000-4000-8000-000000000001",
      run_id: "00000000-0000-4000-8000-000000000002",
      event: ChatStreamEventType.Status,
      stage: AgentActivityStage.Thinking,
    });
    handlers?.onStatus?.({
      conversation_id: "00000000-0000-4000-8000-000000000001",
      run_id: "00000000-0000-4000-8000-000000000002",
      event: ChatStreamEventType.Status,
      stage: AgentActivityStage.SearchingCatalog,
      tool: "search_catalog",
      detail: "RTX 4070",
    });
  });
  expect(screen.getByText("activity.THINKING")).toBeInTheDocument();
  expect(screen.getByText("activity.SEARCHING_CATALOG")).toBeInTheDocument();
  expect(screen.getByText("RTX 4070")).toBeInTheDocument();
  await act(async () => finish({conversation_id: "test", intent: AiMode.Chat, answer: "Đã tìm xong.", products: []}));
  expect(await screen.findByText("Đã tìm xong.")).toBeInTheDocument();
  expect(screen.queryByText("activity.SEARCHING_CATALOG")).not.toBeInTheDocument();
});

it("renders ProposalCard cleanly, hides it while submitting, and supports discarding the proposal", async () => {
  const hash = "b".repeat(64);
  const proposalId = "00000000-0000-4000-8000-000000000044";
  vi.mocked(streamChat).mockResolvedValueOnce({
    conversation_id: "conv-1",
    intent: AiMode.Chat,
    answer: "Bạn xác nhận ngân sách 25 triệu chứ?",
    products: [],
    stateful: {
      revision: 1,
      proposal: {
        proposalId,
        proposalHash: hash,
        targetRevision: 1,
        baseRequirementsHash: hash,
        changes: [
          {
            operation: "SET",
            target: "REQUIREMENT",
            subject: "SETUP",
            predicate: "budget",
            operator: "LTE",
            strength: "HARD",
            value: {kind: "QUANTITY", amount: 25_000_000, unit: "VND"},
          },
        ],
      },
      clarificationOptions: [],
      build: null,
    },
  });

  let finishDiscard!: (value: Awaited<ReturnType<typeof streamChat>>) => void;
  vi.mocked(streamChat).mockImplementationOnce(
    () => new Promise((resolve) => {finishDiscard = resolve;}),
  );

  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Build PC 25 triệu" />);
  await user.click(screen.getByRole("button", {name: /send/}));

  expect(await screen.findByText("proposal.title")).toBeInTheDocument();
  expect(screen.queryByText(/SET SETUP/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", {name: "confirmProposal"})).toBeInTheDocument();
  const discardButton = screen.getByRole("button", {name: "discardProposal"});

  await user.click(discardButton);
  // Proposal card hides immediately while the discard turn is running so the UI never looks stuck.
  expect(screen.queryByText("proposal.title")).not.toBeInTheDocument();
  expect(streamChat).toHaveBeenLastCalledWith(
    "discardProposal",
    "conv-1",
    expect.any(Object),
    expect.any(AbortSignal),
    {
      pendingAction: {
        schema_version: 2,
        target: "PROPOSAL",
        action: "DISCARD",
        proposal_id: proposalId,
        proposal_hash: hash,
        target_revision: 1,
        base_requirements_hash: hash,
      },
    },
  );

  await act(async () =>
    finishDiscard({
      conversation_id: "conv-1",
      intent: AiMode.Chat,
      answer: "Đã hủy đề xuất.",
      products: [],
      stateful: {revision: 2, proposal: null, clarificationOptions: [], build: null},
    }),
  );
  expect(await screen.findByText("Đã hủy đề xuất.")).toBeInTheDocument();
  expect(screen.queryByText("proposal.title")).not.toBeInTheDocument();
});

it("lets the user stop an in-flight run to unlock the UI and cancels the admitted run", async () => {
  vi.mocked(streamChat).mockImplementationOnce(async (_message, _conversation, handlers) => {
    handlers?.onRunAdmitted?.("conv-stuck", "run-stuck");
    return new Promise(() => {});
  });
  const user = userEvent.setup();
  render(<AssistantPage initialPrompt="Build PC 30 triệu" />);
  await user.click(screen.getByRole("button", {name: /send/}));

  expect(screen.getByRole("textbox", {name: "promptLabel"})).toBeDisabled();
  const stopButton = await screen.findByRole("button", {name: "stop"});
  expect(stopButton).toBeEnabled();
  expect(screen.getByRole("button", {name: "newConversation"})).toBeEnabled();

  await user.click(stopButton);
  expect(screen.getByRole("textbox", {name: "promptLabel"})).toBeEnabled();
  expect(cancelRun).toHaveBeenCalledWith("conv-stuck", "run-stuck");
});
