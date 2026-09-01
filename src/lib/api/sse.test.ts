import {describe, expect, it} from "vitest";

import {parseSse} from "./sse";

describe("SSE parser", () => {
  it("parses JSON frames split across chunks and normalizes CRLF", async () => {
    const encoder = new TextEncoder();
    const chunks = [
      "event: delta\r\ndata: {\"delta\":\"hel",
      "lo\"}\r\n\r\nevent: complete\r\ndata: {\"ok\":true}\r\n\r\n",
    ];
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    });

    const frames = [];
    for await (const frame of parseSse<{delta?: string; ok?: boolean}>(body)) {
      frames.push(frame);
    }

    expect(frames).toEqual([
      {event: "delta", data: {delta: "hello"}},
      {event: "complete", data: {ok: true}},
    ]);
  });
});
