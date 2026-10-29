import {afterEach, expect, it, vi} from "vitest";
import {loadConversationHistory, setConversationUrl} from "./conversation-history";

const cid = "00000000-0000-4000-8000-000000000001";
const rid = "00000000-0000-4000-8000-000000000002";
const pendingId = "00000000-0000-4000-8000-000000000003";
const requestId = "00000000-0000-4000-8000-000000000004";
const cursor = "00000000-0000-4000-8000-000000000005";
const envelope = (data: unknown) => ({data, message: "SUCCESS", errors: []});
const run = {conversation_id: cid, run_id: rid, request_id: requestId, base_revision: 0, status: "COMPLETED"};
const final = {conversation_id: cid, run_id: rid, sequence: 3, event: "COMPLETED", result: {
  schema_version: 2, run, revision: 1, answer: "**Ưu tiên di động**", products: [], flexible: null, build: null,
}};

afterEach(() => {vi.unstubAllGlobals(); window.history.replaceState(null, "", "/");});

it("stores conversation identity without dropping locale or hash and clears it for a new chat", () => {
  window.history.replaceState(null, "", "/vi/assistant?productId=old#chat");
  setConversationUrl(cid);
  expect(window.location.pathname).toBe("/vi/assistant");
  expect(new URL(window.location.href).searchParams.get("conversationId")).toBe(cid);
  expect(new URL(window.location.href).searchParams.has("productId")).toBe(false);
  expect(window.location.hash).toBe("#chat");
  setConversationUrl();
  expect(window.location.search).toBe("");
});

it("loads paged messages and the exact latest typed result without admitting another run", async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json(envelope({items: [{run_id: rid, role: "user", content: "Laptop?"}], next_cursor: cursor})))
    .mockResolvedValueOnce(Response.json(envelope({items: [
      {run_id: rid, role: "assistant", content: "Ưu tiên di động"},
      {run_id: pendingId, role: "user", content: "Lập trình backend"},
    ], next_cursor: null})))
    .mockResolvedValueOnce(Response.json(envelope(final)))
    .mockResolvedValueOnce(Response.json(envelope({...run, run_id: pendingId, status: "RUNNING"})));
  vi.stubGlobal("fetch", fetch);
  const history = await loadConversationHistory(cid);
  expect(history.turns).toHaveLength(2);
  expect(history.turns[0]).toMatchObject({prompt: "Laptop?", response: {answer: "**Ưu tiên di động**", stateful: {revision: 1}}});
  expect(history.turns[1]).toMatchObject({prompt: "Lập trình backend"});
  expect(history.pendingRunId).toBe(pendingId);
  expect(fetch.mock.calls.every((call) => !call[1]?.method || call[1].method === "GET")).toBe(true);
  expect(fetch.mock.calls[2][0]).toBe(`/api/ai/conversations/${cid}/runs/${rid}/result`);
});

it("keeps a missing or foreign conversation rejected instead of starting a replacement", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({data: null, message: "AI_CONVERSATION_NOT_FOUND", errors: []}, {status: 404}));
  vi.stubGlobal("fetch", fetch);
  await expect(loadConversationHistory(cid)).rejects.toMatchObject({status: 404});
  expect(fetch).toHaveBeenCalledTimes(1);
});
