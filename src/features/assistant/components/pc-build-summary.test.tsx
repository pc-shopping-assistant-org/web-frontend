import {cleanup, render, screen} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {NextIntlClientProvider} from "next-intl";
import {afterEach, expect, it, vi} from "vitest";

import {PcBuildSummary} from "./pc-build-summary";

vi.mock("@/i18n/navigation", () => ({
  Link: ({children, href, className}: {children: React.ReactNode; href: string; className?: string}) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

afterEach(cleanup);

const testQueryClient = new QueryClient({defaultOptions: {queries: {retry: false}, mutations: {retry: false}}});

it("pre-fills the /build-pc link with variant IDs and maps STORAGE to SSD", () => {
  const cpuVariantId = "11111111-1111-4111-8111-111111111111";
  const ssdVariantId = "22222222-2222-4222-8222-222222222222";
  render(
    <QueryClientProvider client={testQueryClient}>
      <NextIntlClientProvider
        locale="vi"
        messages={{
          assistant: {
            build: {
              title: "Cấu hình PC tối ưu",
              subtitle: "Tương thích",
              compatible: "100% Tương thích",
              colSlot: "Linh kiện",
              colProduct: "Tên sản phẩm",
              colPrice: "Đơn giá",
              owned: "Đã có",
              pinned: "Cố định",
              total: "Tổng",
              ownedExcluded: "Đã trừ {count}",
              addAll: "Thêm toàn bộ",
              adding: "Đang thêm {done}/{total}",
              added: "Đã thêm {count}",
              openBuilder: "Tự tùy chỉnh thêm",
              slots: {CPU: "CPU", STORAGE: "Ổ cứng"},
            },
          },
        }}
      >
        <PcBuildSummary
          build={{
            compatibilityStatus: "COMPATIBLE",
            totalSpending: 10000000,
            parts: [
              {slot: "CPU", name: "Intel Core i5-14600K", variantId: cpuVariantId, spending: 7000000, owned: false, pinned: false},
              {slot: "STORAGE", name: "Samsung 990 Pro 1TB", variantId: ssdVariantId, spending: 3000000, owned: false, pinned: false},
            ],
          }}
        />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );

  const link = screen.getByRole("link", {name: "Tự tùy chỉnh thêm"});
  const href = link.getAttribute("href") ?? "";
  expect(href.startsWith("/build-pc?build=")).toBe(true);
  const parsed = JSON.parse(decodeURIComponent(href.slice("/build-pc?build=".length)));
  expect(parsed).toEqual({CPU: cpuVariantId, SSD: ssdVariantId});
});
