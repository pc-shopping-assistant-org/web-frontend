import {cleanup, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {NextIntlClientProvider} from "next-intl";
import {afterEach, expect, it, vi} from "vitest";

import {AssistantFloatingWidget} from "./assistant-floating-widget";

let currentPathname = "/products/rtx-4070-super";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => currentPathname,
  Link: ({children, href, className, onClick}: {children: React.ReactNode; href: string; className?: string; onClick?: () => void}) => (
    <a href={href} className={className} onClick={onClick}>{children}</a>
  ),
}));

vi.mock("@/features/catalog/queries", () => ({
  useProductBySlug: (slug: string) => ({
    data: slug ? {id: "11111111-1111-4111-8111-111111111111", name: "RTX 4070 Super"} : undefined,
  }),
}));

vi.mock("../assistant-page", () => ({
  AssistantPage: ({variant, onCloseWidget, contextProduct}: {variant?: string; onCloseWidget?: () => void; contextProduct?: {id: string; name: string}}) => (
    <div data-testid="mock-assistant-widget" data-variant={variant}>
      {contextProduct ? <span>Context: {contextProduct.name}</span> : null}
      <button type="button" onClick={onCloseWidget}>Close widget</button>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  currentPathname = "/products/rtx-4070-super";
});

const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}});

function renderWidget() {
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider
        locale="vi"
        messages={{assistant: {floatingOpen: "Hỏi AI", chatTitle: "gearPC AI"}, common: {close: "Đóng"}}}
      >
        <AssistantFloatingWidget />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

it("renders the floating bubble on product pages, lazy-opens with product context, and closes cleanly", async () => {
  const user = userEvent.setup();
  renderWidget();

  expect(screen.queryByTestId("mock-assistant-widget")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", {name: "Hỏi AI"}));

  expect(screen.getByTestId("mock-assistant-widget")).toHaveAttribute("data-variant", "widget");
  expect(screen.getByText("Context: RTX 4070 Super")).toBeInTheDocument();

  await user.click(screen.getByRole("button", {name: "Close widget"}));
  expect(screen.getByRole("button", {name: "Hỏi AI"})).toBeInTheDocument();
});

it("hides the floating bubble on /assistant and /checkout routes", () => {
  currentPathname = "/assistant";
  const {rerender} = renderWidget();
  expect(screen.queryByRole("button", {name: "Hỏi AI"})).not.toBeInTheDocument();

  currentPathname = "/checkout";
  rerender(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider
        locale="vi"
        messages={{assistant: {floatingOpen: "Hỏi AI", chatTitle: "gearPC AI"}, common: {close: "Đóng"}}}
      >
        <AssistantFloatingWidget />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
  expect(screen.queryByRole("button", {name: "Hỏi AI"})).not.toBeInTheDocument();
});
