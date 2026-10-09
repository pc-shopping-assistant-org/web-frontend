import {describe, expect, it} from "vitest";
import {GET} from "@/app/api/mock/pc-builder/components/route";
import {POST as quote} from "@/app/api/mock/pc-builder/quote/route";
import {POST as validate} from "@/app/api/mock/pc-builder/validate/route";

const request = (body: unknown) => new Request("http://localhost/api/mock/pc-builder/quote", {method: "POST", body: JSON.stringify(body)});

describe("PC builder mock API boundaries", () => {
  it("returns the exact static envelope and only the requested slot", async () => {
    const response = GET(new Request("http://localhost/api/mock/pc-builder/components?slot=CPU"));
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["data", "errors", "message"]);
    expect(body.message).toBe("PC_BUILD_COMPONENTS_FOUND");
    expect(body.data.every((part: {slot: string}) => part.slot === "CPU")).toBe(true);
  });
  it("rejects invalid slots, unknown IDs and injected prices", async () => {
    expect(GET(new Request("http://localhost/api/mock/pc-builder/components?slot=nope")).status).toBe(400);
    expect((await quote(request({selection: {CPU: "missing"}}))).status).toBe(400);
    expect((await quote(request({selection: {CPU: "cpu-amd"}, total: 1}))).status).toBe(400);
    expect((await quote(request({selection: {HACK: "cpu-amd"}}))).status).toBe(400);
  });
  it("handles malformed JSON without throwing", async () => {
    const response = await quote(new Request("http://localhost", {method: "POST", body: "{"}));
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("PC_BUILD_INVALID_REQUEST");
  });
  it("validates all candidates in one request with conflict precedence", async () => {
    const response = await validate(request({selection: {MAINBOARD: "board-intel"}, slot: "CPU"}));
    const body = await response.json();
    expect(body.data["cpu-amd"]).toBe("INCOMPATIBLE");
    expect(body.data["cpu-intel"]).toBe("UNKNOWN");
  });
});
