import {afterEach, beforeEach, expect, it, vi} from "vitest";
import {streamChat} from "./stateful-api";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const cid = "00000000-0000-4000-8000-000000000001";
const rid = "00000000-0000-4000-8000-000000000002";
const requestId = "00000000-0000-4000-8000-000000000003";
beforeEach(() => vi.spyOn(crypto, "randomUUID").mockReturnValue(requestId));
const envelope = (data: unknown) => ({data, message: "SUCCESS", errors: []});
const run = {conversation_id: cid, run_id: rid, request_id: requestId, base_revision: 0, status: "PENDING"};
const completedResult = {
  schema_version: 2, run: {...run, status: "COMPLETED"}, revision: 1,
  answer: "Bạn cần ưu tiên tính di động hay hiệu năng?", build: null, flexible: null,
  products: [],
};

it("creates a V2 run and consumes one SSE connection without reconnect", async () => {
  const result = {
    schema_version: 2,
    run: {...run, status: "COMPLETED"},
    revision: 1,
    answer: "Cấu hình phù hợp",
    build: null,
    flexible: null,
    products: [{id: cid, name: "Canonical GPU", list_price: 8000000, specifications: {}}],
  };
  const frames = [
    {event: "START", sequence: 1, run},
    {event: "DELTA", sequence: 2, delta: "Cấu hình phù hợp"},
    {event: "COMPLETED", sequence: 3, result},
  ]
    .map(
      (event) =>
        `event: ${event.event.toLowerCase()}\ndata: ${JSON.stringify(envelope({...event, conversation_id: cid, run_id: rid}))}\n\n`,
    )
    .join("");
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json(envelope({schema_version: 2, conversation_id: cid, revision: 0})))
    .mockResolvedValueOnce(Response.json(envelope(run)))
    .mockResolvedValueOnce(new Response(frames, {headers: {"content-type": "text/event-stream"}}));
  vi.stubGlobal("fetch", fetch);
  const deltas: string[] = [];
  const answer = await streamChat("Build PC", undefined, {onDelta: (text) => deltas.push(text)}, undefined, {selectedProductIds: [cid]});
  expect(answer.answer).toBe(result.answer);
  expect(answer.products[0]).toMatchObject({id: cid, name: "Canonical GPU", list_price: 8000000});
  expect(deltas).toEqual([result.answer]);
  expect(fetch.mock.calls.map((call) => call[0])).toEqual([
    "/api/ai/conversations",
    `/api/ai/conversations/${cid}/runs`,
    `/api/ai/conversations/${cid}/runs/${rid}/events`,
  ]);
  const submitted = JSON.parse(fetch.mock.calls[1][1].body);
  expect(submitted).toMatchObject({schema_version: 2, expected_revision: 0, conversation_id: cid, message: "Build PC"});
  expect(submitted.request_id).toMatch(/^[0-9a-f-]{36}$/);
  expect(submitted.selected_product_ids).toEqual([cid]);
  expect(fetch.mock.calls[2][1].headers).not.toHaveProperty("Last-Event-ID");
});

it("keeps an interrupted admitted run pending and reads its saved result without another admission or SSE", async () => {
  vi.useFakeTimers();
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json(envelope({schema_version: 2, conversation_id: cid, revision: 0})))
    .mockResolvedValueOnce(Response.json(envelope(run)))
    .mockResolvedValueOnce(new Response(": heartbeat\n\n", {headers: {"content-type": "text/event-stream"}}))
    .mockResolvedValueOnce(Response.json(envelope(null), {status: 202}))
    .mockResolvedValueOnce(Response.json(envelope({
      conversation_id: cid, run_id: rid, sequence: 3, event: "COMPLETED", result: completedResult,
    })));
  vi.stubGlobal("fetch", fetch);
  let settled = false;
  const response = streamChat("Tư vấn laptop").finally(() => {settled = true;});
  await vi.advanceTimersByTimeAsync(0);
  expect(settled).toBe(false);
  await vi.runAllTimersAsync();
  expect(await response).toMatchObject({answer: completedResult.answer});
  expect(fetch.mock.calls.map((call) => call[0])).toEqual([
    "/api/ai/conversations", `/api/ai/conversations/${cid}/runs`,
    `/api/ai/conversations/${cid}/runs/${rid}/events`,
    `/api/ai/conversations/${cid}/runs/${rid}/result`,
    `/api/ai/conversations/${cid}/runs/${rid}/result`,
  ]);
});

it("reports a stopped failed run instead of admitting the message again", async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json(envelope({schema_version: 2, conversation_id: cid, revision: 0})))
    .mockResolvedValueOnce(Response.json(envelope(run)))
    .mockRejectedValueOnce(new TypeError("connection lost"))
    .mockResolvedValueOnce(Response.json(envelope({
      conversation_id: cid, run_id: rid, sequence: 2, event: "ERROR", code: "AI_RUN_FAILED",
    })));
  vi.stubGlobal("fetch", fetch);
  await expect(streamChat("Tư vấn laptop")).rejects.toMatchObject({message: "AI_RUN_FAILED"});
  expect(fetch).toHaveBeenCalledTimes(4);
});

it("does not turn an aborted subscription into background polling or cancellation", async () => {
  const controller = new AbortController();
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json(envelope({schema_version: 2, conversation_id: cid, revision: 0})))
    .mockResolvedValueOnce(Response.json(envelope(run)))
    .mockImplementationOnce(() => {
      controller.abort();
      throw new DOMException("Aborted", "AbortError");
    });
  vi.stubGlobal("fetch", fetch);
  await expect(streamChat("Tư vấn laptop", undefined, {}, controller.signal)).rejects.toMatchObject({name: "AbortError"});
  expect(fetch).toHaveBeenCalledTimes(3);
});
