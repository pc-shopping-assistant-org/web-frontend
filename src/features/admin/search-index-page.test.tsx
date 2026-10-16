import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {cleanup, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, expect, it, vi} from "vitest";

import {SearchIndexPage} from "./search-index-page";

const profile = vi.hoisted(() => ({role: "ADMIN" as string | undefined, pending: false}));

vi.mock("next-intl", () => ({useLocale: () => "vi", useTranslations: () => (key: string) => key}));
vi.mock("@/components/ui/error-message", () => ({ErrorMessage: () => <p role="alert">refused</p>}));
vi.mock("@/features/auth/queries", () => ({useProfile: () => ({isPending: profile.pending, data: {role: profile.role}})}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  profile.role = "ADMIN";
  profile.pending = false;
});

function stubSync(result: unknown) {
  const fetchMock = vi.fn().mockImplementation(async () =>
    new Response(JSON.stringify({data: result, message: "SUCCESS", errors: []}), {status: 200, headers: {"content-type": "application/json"}}),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function setup() {
  render(
    <QueryClientProvider client={new QueryClient({defaultOptions: {mutations: {retry: false}}})}>
      <SearchIndexPage />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

async function runSync(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", {name: "action"}));
  await user.click(await screen.findByRole("button", {name: "confirm"}));
}

it("asks first, then rebuilds the index and shows what was done", async () => {
  const fetchMock = stubSync({indexed: 55, removed: 2, failed: 0});
  const user = setup();

  await user.click(screen.getByRole("button", {name: "action"}));
  expect(fetchMock).not.toHaveBeenCalled();
  await user.click(await screen.findByRole("button", {name: "confirm"}));

  expect(await screen.findByText("successAll")).toBeInTheDocument();
  expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/sync-service/products/sync");
  expect(fetchMock.mock.calls[0][1]).toMatchObject({method: "POST"});
  expect(screen.getByText("55")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
});

it("says how many products failed so the admin runs it again", async () => {
  stubSync({indexed: 53, removed: 0, failed: 2});
  const user = setup();

  await runSync(user);

  expect(await screen.findByText("successPartial")).toBeInTheDocument();
  expect(screen.queryByText("successAll")).not.toBeInTheDocument();
});

it("keeps the dialog open with the error when the sync is refused", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () =>
    new Response(JSON.stringify({data: null, message: "FORBIDDEN", errors: []}), {status: 403, headers: {"content-type": "application/json"}}),
  ));
  const user = setup();

  await runSync(user);

  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.queryByText("resultTitle")).not.toBeInTheDocument();
});

it("is closed to staff who are not admins", () => {
  profile.role = "EMPLOYEE";
  setup();

  expect(screen.getByText("forbidden")).toBeInTheDocument();
  expect(screen.queryByRole("button", {name: "action"})).not.toBeInTheDocument();
});
