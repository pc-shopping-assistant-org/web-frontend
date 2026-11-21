import {afterEach, describe, expect, it, vi} from "vitest";

import {checkCompatibility} from "./compatibility-api";

afterEach(() => vi.unstubAllGlobals());

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockImplementation(
    async () => new Response(JSON.stringify(body), {status, headers: {"content-type": "application/json"}}),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const CPU = "0198b3a0-0000-7000-8000-000000000001";
const BOARD = "0198b3a0-0000-7000-8000-000000000002";

describe("checkCompatibility", () => {
  it("asks the AI service, not the catalog, with the variant id of each slot", async () => {
    const fetchMock = stubFetch({data: {overall: "OK", results: []}, message: "SUCCESS", errors: []});

    await checkCompatibility({CPU, MAINBOARD: BOARD});

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/ai/compatibility/check");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({slots: {CPU, MAINBOARD: BOARD}});
  });

  it("reads the snake_case results into the camelCase the page uses", async () => {
    stubFetch({
      data: {
        overall: "INCOMPATIBLE",
        results: [
          {
            rule: "SOCKET",
            status: "INCOMPATIBLE",
            slot_a: "CPU",
            slot_b: "MAINBOARD",
            message: "CPU socket does not fit.",
            suggestion: "Pick another mainboard.",
            missing_attributes: [],
          },
          {rule: "PSU_WATTAGE", status: "UNKNOWN", slot_a: "PSU", slot_b: null, missing_attributes: ["PSU.wattage"]},
        ],
      },
      message: "SUCCESS",
      errors: [],
    });

    const result = await checkCompatibility({CPU, MAINBOARD: BOARD});

    expect(result.overall).toBe("INCOMPATIBLE");
    expect(result.results[0]).toEqual({
      rule: "SOCKET",
      status: "INCOMPATIBLE",
      slotA: "CPU",
      slotB: "MAINBOARD",
      message: "CPU socket does not fit.",
      suggestion: "Pick another mainboard.",
      missingAttributes: [],
    });
    expect(result.results[1]).toMatchObject({slotA: "PSU", slotB: "", message: null, missingAttributes: ["PSU.wattage"]});
  });

  it("fails when the service has no answer for a part, so the page keeps its own fallback", async () => {
    stubFetch({data: null, message: "AI_PRODUCT_NOT_FOUND", errors: [{code: "AI_PRODUCT_NOT_FOUND", message: "Part was not found"}]});

    await expect(checkCompatibility({CPU})).rejects.toThrow();
  });
});
