import {describe, expect, it} from "vitest";

import {formatMoney, formatRating} from "./format";

describe("formatters", () => {
  it("formats VND consistently for both supported locales", () => {
    expect(formatMoney(20_000_000, "vi")).toContain("20.000.000");
    expect(formatMoney(20_000_000, "en")).toContain("20,000,000");
  });

  it("handles missing numeric values", () => {
    expect(formatMoney(undefined, "vi")).toBe("—");
    expect(formatRating(undefined)).toBe("—");
    expect(formatRating(4.25)).toBe("4.3");
  });
});
