import {cleanup, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, expect, it, vi} from "vitest";
import {LoginForm} from "./login-form";

const mocks = vi.hoisted(() => ({login: vi.fn(), resync: vi.fn(), push: vi.fn(), refresh: vi.fn()}));
vi.mock("next-intl", () => ({useTranslations: () => (key: string) => key}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({push: mocks.push, refresh: mocks.refresh}),
  Link: ({children, href}: {children: React.ReactNode; href: string}) => <a href={href}>{children}</a>,
}));
vi.mock("@tanstack/react-query", () => ({useQueryClient: () => ({})}));
vi.mock("./api", () => ({login: mocks.login}));
vi.mock("./queries", () => ({resyncIdentityCaches: mocks.resync}));
vi.mock("./google-login-button", () => ({GoogleLoginButton: () => null}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function signIn() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("email / phone"), "user@example.test");
  await user.type(screen.getByLabelText("password"), "test-password");
  await user.click(screen.getByRole("button", {name: "login"}));
}

it("completes inline sign-in without navigating away from the chat draft", async () => {
  const onSuccess = vi.fn();
  render(<LoginForm onSuccess={onSuccess} />);
  await signIn();
  await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  expect(mocks.resync).toHaveBeenCalledOnce();
  expect(mocks.push).not.toHaveBeenCalled();
  expect(mocks.refresh).not.toHaveBeenCalled();
});

it("preserves the normal login page redirect when no inline callback is provided", async () => {
  render(<LoginForm redirectTo="/account/orders" />);
  await signIn();
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/account/orders"));
  expect(mocks.refresh).toHaveBeenCalledOnce();
});
