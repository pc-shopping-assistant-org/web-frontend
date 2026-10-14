import {afterEach, beforeEach, expect, it, vi} from "vitest";
import {streamChat} from "./stateful-api";

afterEach(() => {vi.unstubAllGlobals(); vi.restoreAllMocks();});
const cid = "00000000-0000-4000-8000-000000000001";
const rid = "00000000-0000-4000-8000-000000000002";
const requestId = "00000000-0000-4000-8000-000000000003";
beforeEach(() => vi.spyOn(crypto, "randomUUID").mockReturnValue(requestId));
const envelope = (data: unknown) => ({data, message: "SUCCESS", errors: []});
const run = {conversation_id: cid, run_id: rid, request_id: requestId, base_revision: 0, status: "PENDING"};

it("creates a V2 run and consumes one SSE connection without reconnect", async () => {
  const result = {schema_version: 2, run: {...run, status: "COMPLETED"}, revision: 1, answer: "Cấu hình phù hợp", build: null, flexible: null,
    products: [{id: cid, name: "Canonical GPU", list_price: 8000000, specifications: {}}]};
  const frames = [
    {event: "START", sequence: 1, run},
    {event: "DELTA", sequence: 2, delta: "Cấu hình phù hợp"},
    {event: "COMPLETED", sequence: 3, result},
  ].map(event => `event: ${event.event.toLowerCase()}\ndata: ${JSON.stringify(envelope({...event, conversation_id: cid, run_id: rid}))}\n\n`).join("");
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json(envelope({schema_version: 2, conversation_id: cid, revision: 0})))
    .mockResolvedValueOnce(Response.json(envelope(run)))
    .mockResolvedValueOnce(new Response(frames, {headers: {"content-type": "text/event-stream"}}));
  vi.stubGlobal("fetch", fetch);
  const deltas: string[] = [];
  const answer = await streamChat("Build PC", undefined, {onDelta: text => deltas.push(text)}, undefined, {selectedProductIds: [cid]});
  expect(answer.answer).toBe(result.answer);
  expect(answer.products[0]).toMatchObject({id: cid, name: "Canonical GPU", list_price: 8000000});
  expect(deltas).toEqual([result.answer]);
  expect(fetch.mock.calls.map(call => call[0])).toEqual([
    "/api/ai/conversations", `/api/ai/conversations/${cid}/runs`,
    `/api/ai/conversations/${cid}/runs/${rid}/events`,
  ]);
  const submitted = JSON.parse(fetch.mock.calls[1][1].body);
  expect(submitted).toMatchObject({schema_version: 2, expected_revision: 0, conversation_id: cid, message: "Build PC"});
  expect(submitted.request_id).toMatch(/^[0-9a-f-]{36}$/);
  expect(submitted.selected_product_ids).toEqual([cid]);
  expect(fetch.mock.calls[2][1].headers).not.toHaveProperty("Last-Event-ID");
});

it("does not retry or fall back to legacy chat after stream interruption", async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json(envelope({schema_version: 2, conversation_id: cid, revision: 0})))
    .mockResolvedValueOnce(Response.json(envelope(run)))
    .mockResolvedValueOnce(new Response(": heartbeat\n\n", {headers: {"content-type": "text/event-stream"}}));
  vi.stubGlobal("fetch", fetch);
  await expect(streamChat("Build PC")).rejects.toMatchObject({message: "AI_CHAT_STREAM_FAILED"});
  expect(fetch).toHaveBeenCalledTimes(3);
});
