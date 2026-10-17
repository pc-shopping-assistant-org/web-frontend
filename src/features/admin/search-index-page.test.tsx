import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {cleanup, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, expect, it, vi} from "vitest";

import {SearchIndexPage} from "./search-index-page";

const profile = vi.hoisted(() => ({role: "ADMIN" as string | undefined, pending: false}));

vi.mock("next-intl", () => ({useLocale: () => "vi", useTranslations: () => (key: string, values?: Record<string, unknown>) => (values ? `${key}:${JSON.stringify(values)}` : key)}));
vi.mock("@/components/ui/error-message", () => ({ErrorMessage: () => <p role="alert">refused</p>}));
vi.mock("@/features/auth/queries", () => ({useProfile: () => ({isPending: profile.pending, data: {role: profile.role}})}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  profile.role = "ADMIN";
  profile.pending = false;
});

const SYNC = "/api/backend/sync-service/products/sync";
const STATUS = "/api/backend/sync-service/products/sync/dlt";
const REPLAY = "/api/backend/sync-service/products/sync/dlt/replay";

type Answers = {sync?: unknown; pending?: number; replay?: unknown};

/** Answers each sync-service call by its address, the way the gateway would. */
function stubBackend({sync = {indexed: 0, removed: 0, failed: 0}, pending = 0, replay = {replayed: 0, skipped: 0, pending: 0, blocked: false}}: Answers = {}) {
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    const data = url === STATUS ? {pending} : url === REPLAY ? replay : sync;
    return new Response(JSON.stringify({data, message: "SUCCESS", errors: []}), {status: 200, headers: {"content-type": "application/json"}});
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const callsTo = (fetchMock: ReturnType<typeof vi.fn>, url: string) => fetchMock.mock.calls.filter((call) => call[0] === url);

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
  const fetchMock = stubBackend({sync: {indexed: 55, removed: 2, failed: 0}});
  const user = setup();

  await user.click(screen.getByRole("button", {name: "action"}));
  expect(callsTo(fetchMock, SYNC)).toHaveLength(0);
  await user.click(await screen.findByRole("button", {name: "confirm"}));

  expect(await screen.findByText("successAll")).toBeInTheDocument();
  expect(callsTo(fetchMock, SYNC)[0][1]).toMatchObject({method: "POST"});
  expect(screen.getByText("55")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
});

it("says how many products failed so the admin runs it again", async () => {
  stubBackend({sync: {indexed: 53, removed: 0, failed: 2}});
  const user = setup();

  await runSync(user);

  expect(await screen.findByText(/successPartial/)).toBeInTheDocument();
  expect(screen.queryByText("successAll")).not.toBeInTheDocument();
});

it("keeps the dialog open with the error when the sync is refused", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) =>
    url === STATUS
      ? new Response(JSON.stringify({data: {pending: 0}, message: "SUCCESS", errors: []}), {status: 200, headers: {"content-type": "application/json"}})
      : new Response(JSON.stringify({data: null, message: "FORBIDDEN", errors: []}), {status: 403, headers: {"content-type": "application/json"}}),
  ));
  const user = setup();

  await runSync(user);

  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.queryByText("resultTitle")).not.toBeInTheDocument();
});

it("is closed to staff who are not admins", () => {
  profile.role = "EMPLOYEE";
  const fetchMock = stubBackend();
  setup();

  expect(screen.getByText("forbidden")).toBeInTheDocument();
  expect(screen.queryByRole("button", {name: "action"})).not.toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("shows how many changes are parked and runs them again on request", async () => {
  const fetchMock = stubBackend({pending: 3, replay: {replayed: 3, skipped: 0, pending: 0, blocked: false}});
  const user = setup();

  expect(await screen.findByText(/dltPending/)).toHaveTextContent('{"count":3}');
  await user.click(screen.getByRole("button", {name: "dltReplay"}));

  expect(await screen.findByText(/dltReplayed/)).toHaveTextContent('{"count":3}');
  expect(callsTo(fetchMock, REPLAY)[0][1]).toMatchObject({method: "POST"});
  expect(screen.queryByText(/dltBlocked/)).not.toBeInTheDocument();
});

it("has nothing to run again when no change is parked", async () => {
  stubBackend({pending: 0});
  setup();

  expect(await screen.findByText("dltNone")).toBeInTheDocument();
  expect(screen.getByRole("button", {name: "dltReplay"})).toBeDisabled();
});

it("says so when the replay stopped on a change that failed again, and when some were unreadable", async () => {
  stubBackend({pending: 5, replay: {replayed: 1, skipped: 1, pending: 3, blocked: true}});
  const user = setup();

  await screen.findByText(/dltPending/);
  await user.click(screen.getByRole("button", {name: "dltReplay"}));

  expect(await screen.findByText(/dltBlocked/)).toHaveTextContent('{"count":3}');
  expect(screen.getByText(/dltSkipped/)).toHaveTextContent('{"count":1}');
});

it("tells the admin when the waiting changes cannot be read", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () =>
    new Response(JSON.stringify({data: null, message: "ERROR", errors: []}), {status: 503, headers: {"content-type": "application/json"}}),
  ));
  setup();

  expect(await screen.findByText("dltUnavailable")).toBeInTheDocument();
});
