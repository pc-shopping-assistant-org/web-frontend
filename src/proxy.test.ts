// @vitest-environment node
import {NextRequest} from "next/server";
import {describe, expect, it} from "vitest";

import {proxy} from "./proxy";

describe("locale entry routing", () => {
  it("redirects the bare root through the configured default locale", () => {
    const response = proxy(new NextRequest("http://localhost/"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/vi");
  });

  it.each(["vi", "en"])("preserves an explicit %s locale", (locale) => {
    const response = proxy(new NextRequest(`http://localhost/${locale}/assistant`));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
