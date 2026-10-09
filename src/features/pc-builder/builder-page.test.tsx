import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {render, screen, within, cleanup} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, describe, expect, it, vi} from "vitest";

import {BuilderPage} from "./builder-page";
import {components} from "./fixtures";
import {toPart, toQuote} from "./mappers";
import {quoteBuild, validateCandidates} from "./service";

vi.mock("next-intl", () => ({useLocale: () => "vi"}));
vi.mock("@/i18n/navigation", () => ({Link: ({children, href, ...props}: {children: React.ReactNode; href: string}) => <a href={href} {...props}>{children}</a>}));
vi.mock("./api", () => ({
  getComponents: async (slot: string) => components.filter(p => p.slot === slot).map(toPart),
  getAccessories: async () => components.filter(p => ["MOUSE", "KEYBOARD", "MONITOR", "HEADSET"].includes(p.slot)).map(toPart),
  getQuote: async (selection: Parameters<typeof quoteBuild>[0]) => toQuote(quoteBuild(selection)),
  getCandidates: async (...args: Parameters<typeof validateCandidates>) => validateCandidates(...args),
}));

afterEach(() => {cleanup(); localStorage.clear();});
function mount() {
  return render(<QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}><BuilderPage /></QueryClientProvider>);
}

describe("PC builder interactions", () => {
  it("enables asking AI only for a quoted build and passes selections, not fake real-product IDs", async () => {
    const user = userEvent.setup();
    mount();
    expect(screen.getByRole("button", {name: "Hỏi AI về cấu hình này"})).toBeDisabled();
    await user.click(screen.getByRole("button", {name: /AMD · AM5/}));
    const link = await screen.findByRole("link", {name: "Hỏi AI về cấu hình này"});
    const url = new URL(link.getAttribute("href")!, "http://localhost");
    expect(JSON.parse(url.searchParams.get("build")!).CPU).toBe("cpu-amd");
    expect(url.searchParams.has("productIds")).toBe(false);
  });
  it("opens full accessory specifications and selects it from the detail dialog", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("tab", {name: "Phụ kiện"}));
    await user.click(within(screen.getByRole("navigation", {name: "Chọn linh kiện"})).getByRole("button", {name: "Chuột"}));
    const heading = await screen.findByRole("heading", {name: "Razer Viper V3 HyperSpeed"});
    await user.click(within(heading).getByRole("button"));
    const dialog = await screen.findByRole("dialog", {name: "Razer Viper V3 HyperSpeed"});
    expect(within(dialog).getByText("DEMO-VIPER")).toBeInTheDocument();
    expect(within(dialog).getByText("82g")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", {name: "Chọn linh kiện"}));
    await screen.findByRole("button", {name: "Bỏ Chuột"});
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("uses a compact accessory card with one action and no core-only compatibility UI", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("tab", {name: "Phụ kiện"}));
    await user.click(within(screen.getByRole("navigation", {name: "Chọn linh kiện"})).getByRole("button", {name: "Chuột"}));
    const heading = await screen.findByRole("heading", {name: "Razer Viper V3 HyperSpeed"});
    const card = within(heading.closest("article")!);
    expect(card.queryByRole("button", {name: "Chọn & tiếp tục"})).not.toBeInTheDocument();
    expect(card.queryByText("Chưa đủ dữ liệu để kiểm tra")).not.toBeInTheDocument();
    await user.click(card.getByRole("button", {name: "Chọn linh kiện"}));
    await screen.findByRole("button", {name: "Bỏ Chuột"});
  });
  it("keeps the setup empty state compact and remembers each tab's last category", async () => {
    const user = userEvent.setup();
    mount();
    const summary = screen.getByRole("complementary", {name: "Góc máy của bạn"});
    expect(within(summary).getByText("Góc máy đang trống")).toBeInTheDocument();
    expect(within(summary).queryByText("Chưa chọn")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", {name: "Phụ kiện"}));
    await user.click(within(screen.getByRole("navigation", {name: "Chọn linh kiện"})).getByRole("button", {name: "Chuột"}));
    await user.click(screen.getByRole("tab", {name: "Core"}));
    await user.click(screen.getByRole("tab", {name: "Phụ kiện"}));
    expect(within(screen.getByRole("navigation", {name: "Chọn linh kiện"})).getByRole("button", {name: "Chuột"})).toHaveAttribute("aria-pressed", "true");
  });
  it("switches Core and peripherals tabs while keeping the build and supports editing from setup", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", {name: /AMD · AM5/}));
    const peripheralTab = screen.getByRole("tab", {name: "Phụ kiện"});
    await user.click(peripheralTab);
    expect(peripheralTab).toHaveAttribute("aria-selected", "true");
    const navigation = screen.getByRole("navigation", {name: "Chọn linh kiện"});
    expect(within(navigation).queryByRole("button", {name: /Vi xử lý/})).not.toBeInTheDocument();
    await user.click(within(navigation).getByRole("button", {name: /Chuột/}));
    await screen.findByRole("heading", {name: "Razer Viper V3 HyperSpeed"});
    await user.click(screen.getByRole("button", {name: "Thay thế Vi xử lý"}));
    expect(screen.getByRole("tab", {name: "Core"})).toHaveAttribute("aria-selected", "true");
    await screen.findByRole("heading", {name: "AMD Ryzen 5 7600"});
  });
  it("suggests peripherals and adds a mouse without replacing the PC build", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", {name: /AMD · AM5/}));
    const title = await screen.findByRole("heading", {name: "Logitech G305 Lightspeed"});
    await user.click(within(title.closest("article")!).getByRole("button", {name: "Thêm vào cấu hình"}));
    await screen.findByRole("button", {name: "Bỏ Chuột"});
    expect(screen.getByRole("button", {name: "Bỏ Vi xử lý"})).toBeInTheDocument();
    expect(screen.getByRole("button", {name: "Bỏ Bo mạch chủ"})).toBeInTheDocument();
  });
  it("selects, keeps selection across slots, and removes a part", async () => {
    const user = userEvent.setup();
    mount();
    const title = await screen.findByRole("heading", {name: "AMD Ryzen 5 7600"});
    await user.click(within(title.closest("article")!).getByRole("button", {name: "Chọn linh kiện"}));
    await screen.findByRole("button", {name: "Bỏ Vi xử lý"});
    const navigation = screen.getByRole("navigation", {name: "Chọn linh kiện"});
    await user.click(within(navigation).getByRole("button", {name: /Bộ nhớ RAM/}));
    await screen.findByRole("heading", {name: "Kingston Fury Beast 32GB (2×16GB)"});
    expect(screen.getByRole("button", {name: "Bỏ Vi xử lý"})).toBeInTheDocument();
    await user.click(screen.getByRole("button", {name: "Bỏ Vi xử lý"}));
    expect(screen.queryByRole("button", {name: "Bỏ Vi xử lý"})).not.toBeInTheDocument();
  });
  it("saves sample builds locally and restores them without using a real cart", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", {name: /AMD · AM5/}));
    const save = screen.getByRole("button", {name: "Lưu trên máy"});
    await vi.waitFor(() => expect(save).toBeEnabled());
    await user.click(save);
    expect(JSON.parse(localStorage.getItem("gearpc:demo-build:v1")!).CPU).toBe("cpu-amd");
    await user.click(screen.getByRole("button", {name: "Xóa cấu hình"}));
    await user.click(screen.getByRole("button", {name: "Mở bản đã lưu"}));
    await screen.findByRole("button", {name: "Bỏ Vi xử lý"});
    expect(screen.queryByRole("button", {name: /Thêm vào giỏ/})).not.toBeInTheDocument();
  });
  it("shares only selections, not a client-controlled quote", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", {name: /AMD · AM5/}));
    const share = screen.getByRole("button", {name: "Chia sẻ"});
    await vi.waitFor(() => expect(share).toBeEnabled());
    await user.click(share);
    const input = await screen.findByRole("textbox", {name: "Liên kết cấu hình"});
    const url = new URL((input as HTMLInputElement).value);
    const selection = JSON.parse(url.searchParams.get("build")!);
    expect(selection.CPU).toBe("cpu-amd");
    expect(selection.total).toBeUndefined();
  });
  it("filters known conflicts but keeps candidates with unknown compatibility", async () => {
    const user = userEvent.setup();
    mount();
    const title = await screen.findByRole("heading", {name: "AMD Ryzen 5 7600"});
    await user.click(within(title.closest("article")!).getByRole("button", {name: "Chọn linh kiện"}));
    await user.click(within(screen.getByRole("navigation", {name: "Chọn linh kiện"})).getByRole("button", {name: /Bo mạch chủ/}));
    await screen.findByRole("heading", {name: "ASUS TUF Gaming B760-Plus"});
    await user.click(screen.getByRole("checkbox", {name: "Ẩn linh kiện có xung đột đã biết"}));
    await vi.waitFor(() => expect(screen.queryByRole("heading", {name: "ASUS TUF Gaming B760-Plus"})).not.toBeInTheDocument());
    expect(screen.getByRole("heading", {name: "MSI PRO B650M-A WiFi"})).toBeInTheDocument();
  });
});
