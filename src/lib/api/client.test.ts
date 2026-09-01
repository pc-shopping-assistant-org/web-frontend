import {afterEach, describe, expect, it, vi} from "vitest";

import {ApiClientError} from "./envelope";
import {aiFetch, aiStreamFetch, backendFetch} from "./client";

afterEach(() => vi.restoreAllMocks());

describe("BFF API client", () => {
  it("calls the same-origin backend route and unwraps only data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({data: {items: []}, message: "SUCCESS", errors: []}), {status: 200}));
    vi.stubGlobal("fetch", fetchMock);

    await expect(backendFetch<{items: unknown[]}>("/products")).resolves.toEqual({items: []});
    expect(fetchMock).toHaveBeenCalledWith("/api/backend/products", expect.objectContaining({credentials: "include"}));
  });

  it("preserves a static upstream error key", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({data: null, message: "INVALID_CREDENTIALS", errors: []}), {status: 401})));

    await expect(aiFetch("/health")).rejects.toMatchObject({status: 401, messageKey: "INVALID_CREDENTIALS"} satisfies Partial<ApiClientError>);
  });

  it("maps a network failure to a stable service key", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(backendFetch("/products")).rejects.toMatchObject({status: 503, messageKey: "SERVICE_UNAVAILABLE"} satisfies Partial<ApiClientError>);
  });

  it("keeps a successful AI response body open for streaming", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: {}\n\n"));
        controller.close();
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: {"content-type": "text/event-stream"},
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await aiStreamFetch("/chat/stream", {method: "POST"});

    expect(response.body).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai/chat/stream",
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({Accept: "text/event-stream"}),
      }),
    );
  });
});
