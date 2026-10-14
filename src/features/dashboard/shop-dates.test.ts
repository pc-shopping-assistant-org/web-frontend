import {describe, expect, it} from "vitest";

import {daysBefore, daysInRange, monthsInRange, rangeProblem, shopDay} from "./shop-dates";

describe("shop dates", () => {
  it("reads the day in the shop time zone, not the browser one", () => {
    // 18:30 UTC is already the next morning in Ho Chi Minh City
    expect(shopDay(new Date("2026-10-09T18:30:00Z"))).toBe("2026-10-10");
    expect(shopDay(new Date("2026-10-09T16:30:00Z"))).toBe("2026-10-09");
  });

  it("counts days and months with both ends", () => {
    expect(daysBefore("2026-03-01", 1)).toBe("2026-02-28");
    expect(daysBefore("2026-10-10", 29)).toBe("2026-09-11");
    expect(daysInRange("2026-10-01", "2026-10-01")).toBe(1);
    expect(daysInRange("2026-10-01", "2026-10-30")).toBe(30);
    expect(monthsInRange("2026-10-15", "2026-10-20")).toBe(1);
    expect(monthsInRange("2025-11-30", "2026-02-01")).toBe(4);
  });

  it("finds a range the backend would refuse", () => {
    expect(rangeProblem("2026-10-10", "2026-10-01", "DAY")).toBe("order");
    expect(rangeProblem("2026-10-10", "2026-10-10", "DAY")).toBeUndefined();
    expect(rangeProblem("2025-10-09", "2026-10-10", "DAY")).toBe("tooLong"); // 367 days
    expect(rangeProblem("2025-10-10", "2026-10-10", "DAY")).toBeUndefined(); // 366 days
    expect(rangeProblem("2020-01-01", "2026-10-10", "MONTH")).toBe("tooLong");
    expect(rangeProblem("2021-11-01", "2026-10-10", "MONTH")).toBeUndefined(); // 60 months
  });
});
