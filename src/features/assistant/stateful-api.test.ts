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

it("accepts a verified unranked build with a null objective", async () => {
  const result = {...completedResult, answer: "Cấu hình tương thích; chưa đủ dữ liệu xếp hạng.", build: {
    objective: null, ranking_status: "UNRANKED", total_spending_vnd: 2500000, stale: false,
    parts: [{slot: "CPU", name: "Canonical CPU", variant_id: cid, spending_vnd: 2500000, is_owned: false, is_pinned: false}],
  }};
  const frames = [{event: "START", sequence: 1, run}, {event: "COMPLETED", sequence: 2, result}]
    .map((event) => `data: ${JSON.stringify(envelope({...event, conversation_id: cid, run_id: rid}))}\n\n`).join("");
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(Response.json(envelope({schema_version: 2, conversation_id: cid, revision: 0})))
    .mockResolvedValueOnce(Response.json(envelope(run)))
    .mockResolvedValueOnce(new Response(frames, {headers: {"content-type": "text/event-stream"}})));
  const response = await streamChat("Build PC");
  expect(response.answer).toContain("chưa đủ dữ liệu");
  expect(response.stateful?.build).toMatchObject({totalSpending: 2500000, parts: [{name: "Canonical CPU"}]});
});

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
  const onReconnecting = vi.fn();
  const answer = await streamChat("Build PC", undefined, {onDelta: (text) => deltas.push(text), onReconnecting}, undefined, {selectedProductIds: [cid]});
  expect(onReconnecting).not.toHaveBeenCalled();
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
  const onReconnecting = vi.fn();
  const response = streamChat("Tư vấn laptop", undefined, {onReconnecting}).finally(() => {settled = true;});
  await vi.advanceTimersByTimeAsync(0);
  expect(settled).toBe(false);
  expect(onReconnecting).toHaveBeenCalledTimes(1);
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

it("survives a network change during result delivery without submitting the turn twice", async () => {
  vi.useFakeTimers();
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json(envelope({schema_version: 2, conversation_id: cid, revision: 0})))
    .mockResolvedValueOnce(Response.json(envelope(run)))
    .mockRejectedValueOnce(new TypeError("ERR_NETWORK_CHANGED"))
    .mockRejectedValueOnce(new TypeError("ERR_NETWORK_CHANGED"))
    .mockResolvedValueOnce(Response.json(envelope(null), {status: 202}))
    .mockResolvedValueOnce(Response.json(envelope({
      conversation_id: cid, run_id: rid, sequence: 3, event: "COMPLETED", result: completedResult,
    })));
  vi.stubGlobal("fetch", fetch);
  const response = streamChat("Build PC");
  const assertion = expect(response).resolves.toMatchObject({answer: completedResult.answer});
  await vi.runAllTimersAsync();
  await assertion;
  expect(fetch.mock.calls.filter((call) => call[1].method === "POST")).toHaveLength(2);
  expect(fetch.mock.calls.filter((call) => String(call[0]).endsWith("/events"))).toHaveLength(1);
});

it("keeps an admitted run pending while offline until delivery resumes or the user aborts", async () => {
  vi.useFakeTimers();
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json(envelope({schema_version: 2, conversation_id: cid, revision: 0})))
    .mockResolvedValueOnce(Response.json(envelope(run)))
    .mockRejectedValue(new TypeError("offline"));
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  let settled = false;
  const response = streamChat("Build PC", undefined, {}, controller.signal).finally(() => {settled = true;});
  const assertion = expect(response).rejects.toMatchObject({name: "AbortError"});
  await vi.advanceTimersByTimeAsync(10000);
  expect(settled).toBe(false);
  expect(fetch.mock.calls.filter((call) => String(call[0]).endsWith("/events"))).toHaveLength(1);
  controller.abort();
  await assertion;
});

it.each(["headers", "body"])("retries admission interrupted at %s with the same request_id and payload", async (interruption) => {
  vi.useFakeTimers();
  const frames = [{event:"START",sequence:1,run},{event:"COMPLETED",sequence:2,result:completedResult}]
    .map((event) => `data: ${JSON.stringify(envelope({...event,conversation_id:cid,run_id:rid}))}\n\n`).join("");
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json(envelope({schema_version:2,conversation_id:cid,revision:0})));
  if (interruption === "headers") fetch.mockRejectedValueOnce(new TypeError("NET_CHANGED after commit"));
  else fetch.mockResolvedValueOnce(new Response(new ReadableStream({
    start(controller) {controller.error(new TypeError("NET_CHANGED reading admission body"));},
  }), {status: 202}));
  fetch
    .mockResolvedValueOnce(Response.json(envelope(run)))
    .mockResolvedValueOnce(new Response(frames,{headers:{"content-type":"text/event-stream"}}));
  vi.stubGlobal("fetch",fetch);
  const response = streamChat("Explain product");
  const assertion = expect(response).resolves.toMatchObject({answer:completedResult.answer});
  await vi.runAllTimersAsync();
  await assertion;
  expect(fetch.mock.calls[1][1].body).toBe(fetch.mock.calls[2][1].body);
  expect(JSON.parse(fetch.mock.calls[1][1].body).request_id).toBe(requestId);
  expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls.filter((call) => String(call[0]).endsWith("/events"))).toHaveLength(1);
});

it.each([401, 403, 404, 410])("does not retry terminal result HTTP %s", async (status) => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json(envelope({schema_version: 2, conversation_id: cid, revision: 0})))
    .mockResolvedValueOnce(Response.json(envelope(run)))
    .mockRejectedValueOnce(new TypeError("lost SSE"))
    .mockResolvedValueOnce(Response.json({data:null,message:"AI_NOT_FOUND",errors:[]}, {status}));
  vi.stubGlobal("fetch", fetch);
  await expect(streamChat("Build PC")).rejects.toMatchObject({status});
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

it("recovers from AI_CONVERSATION_BUSY by waiting for the prior run and resubmitting", async () => {
  const priorRunId = "00000000-0000-4000-8000-000000000099";
  const priorCompleted = {
    schema_version: 2,
    run: {...run, run_id: priorRunId, base_revision: 0, status: "COMPLETED"},
    revision: 1,
    answer: "Done prior",
    products: [],
  };
  const secondRunId = "00000000-0000-4000-8000-000000000088";
  const secondRun = {...run, run_id: secondRunId, base_revision: 1};
  const secondCompleted = {
    schema_version: 2,
    run: {...secondRun, status: "COMPLETED"},
    revision: 2,
    answer: "Done second",
    products: [],
  };
  const frames = [
    {event: "START", sequence: 1, run: secondRun},
    {event: "COMPLETED", sequence: 2, result: secondCompleted},
  ].map((event) => `data: ${JSON.stringify(envelope({...event, conversation_id: cid, run_id: secondRunId}))}\n\n`).join("");

  const fetch = vi.fn()
    // 1. Initial read conversation (rev 0)
    .mockResolvedValueOnce(Response.json(envelope({schema_version: 2, conversation_id: cid, revision: 0})))
    // 2. Submit run fails with 409 AI_CONVERSATION_BUSY
    .mockResolvedValueOnce(Response.json({data: null, message: "AI_CONVERSATION_BUSY", errors: [{code: "AI_CONVERSATION_BUSY"}]}, {status: 409}))
    // 3. Recovery: fetch messages to get last run
    .mockResolvedValueOnce(Response.json(envelope({items: [{run_id: priorRunId}]})))
    // 4. Wait for prior run result: poll GET run result
    .mockResolvedValueOnce(Response.json(envelope(priorCompleted)))
    // 5. Recovery: get updated conversation (rev 1)
    .mockResolvedValueOnce(Response.json(envelope({schema_version: 2, conversation_id: cid, revision: 1})))
    // 6. Resubmit run with rev 1 succeeds!
    .mockResolvedValueOnce(Response.json(envelope(secondRun)))
    // 7. Consume SSE stream for second run
    .mockResolvedValueOnce(new Response(frames, {headers: {"content-type": "text/event-stream"}}));

  vi.stubGlobal("fetch", fetch);
  const result = await streamChat("Lượt thứ 2", cid);
  expect(result.answer).toBe("Done second");
});
