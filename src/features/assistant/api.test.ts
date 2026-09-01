import {afterEach, describe, expect, it, vi} from "vitest";

import {streamChat} from "./api";

afterEach(() => vi.restoreAllMocks());

describe("assistant streaming API", () => {
  it("maps start, deltas and completion without exposing SSE details", async () => {
    const conversationId = "00000000-0000-4000-8000-000000000001";
    const envelope = (data: unknown, message: string) =>
      JSON.stringify({data, message, errors: []});
    const frames = [
      `event: start\ndata: ${envelope({event: "START", conversation_id: conversationId}, "AI_CHAT_STREAM_STARTED")}\n\n`,
      `event: delta\ndata: ${envelope({event: "DELTA", conversation_id: conversationId, delta: "Xin "}, "AI_CHAT_STREAM_DELTA")}\n\n`,
      `event: delta\ndata: ${envelope({event: "DELTA", conversation_id: conversationId, delta: "chào"}, "AI_CHAT_STREAM_DELTA")}\n\n`,
      `event: completed\ndata: ${envelope({event: "COMPLETED", conversation_id: conversationId, result: {conversation_id: conversationId, intent: "SEARCH", answer: "Xin chào", products: []}}, "AI_CHAT_STREAM_COMPLETED")}\n\n`,
    ].join("");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(frames, {
          status: 200,
          headers: {"content-type": "text/event-stream"},
        }),
      ),
    );
    const deltas: string[] = [];
    const started: string[] = [];

    const result = await streamChat(
      "tìm laptop",
      undefined,
      {
        onStart: (id) => started.push(id),
        onDelta: (delta) => deltas.push(delta),
      },
    );

    expect(started).toEqual([conversationId]);
    expect(deltas).toEqual(["Xin ", "chào"]);
    expect(result).toMatchObject({
      conversation_id: conversationId,
      intent: "SEARCH",
      answer: "Xin chào",
    });
  });
});
