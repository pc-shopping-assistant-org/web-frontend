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

describe("sign-in pages for someone already signed in", () => {
  const token = (claims: Record<string, unknown>) => `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;
  const live = token({role: "ROLE_CUSTOMER", exp: Math.floor(Date.now() / 1000) + 600});
  const expired = token({role: "ROLE_CUSTOMER", exp: Math.floor(Date.now() / 1000) - 600});
  const visit = (path: string, cookie?: string) =>
    proxy(new NextRequest(`http://localhost${path}`, cookie ? {headers: {cookie: `ecm_access_token=${cookie}`}} : undefined));

  it.each(["login", "register", "forgot-password"])("sends them away from /%s", (page) => {
    expect(visit(`/vi/${page}`, live).headers.get("location")).toBe("http://localhost/vi");
  });

  it("sends them to the page they were headed for", () => {
    expect(visit("/en/login?redirect=%2Forders", live).headers.get("location")).toBe("http://localhost/en/orders");
  });

  it("ignores a redirect that leaves the site", () => {
    expect(visit("/vi/login?redirect=%2F%2Fevil.example", live).headers.get("location")).toBe("http://localhost/vi");
  });

  it("lets a visitor without a session, or with an expired one, see the page", () => {
    expect(visit("/vi/login").headers.get("location")).toBeNull();
    expect(visit("/vi/login", expired).headers.get("location")).toBeNull();
  });
});
