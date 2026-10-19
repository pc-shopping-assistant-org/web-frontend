import {afterEach, describe, expect, it, vi} from "vitest";

import {GET} from "./route";

afterEach(() => vi.unstubAllEnvs());

describe("runtime public config", () => {
  it("reads the current server env on each request without exposing secrets", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "first-client");
    vi.stubEnv("JWT_PRIVATE_KEY", "must-not-leak");
    expect(await (await GET()).json()).toEqual({
      data: {googleClientId: "first-client"},
      message: "SUCCESS",
      errors: [],
    });
    vi.stubEnv("GOOGLE_CLIENT_ID", "second-client");
    const response = await GET();
    expect(await response.json()).toEqual({
      data: {googleClientId: "second-client"},
      message: "SUCCESS",
      errors: [],
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("disables Google when the runtime value is absent, ignoring baked public vars", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "old-build-value");
    expect((await (await GET()).json()).data).toEqual({googleClientId: null});
  });
});
