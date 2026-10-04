import {expect, it} from "vitest";
import {buildQuestion} from "./ask-ai";

it("builds an editable AI question from server-resolved demo parts including peripherals", () => {
  const question = buildQuestion({CPU: "cpu-amd", MOUSE: "mouse-logitech"}, "vi");
  expect(question).toContain("AMD Ryzen 5 7600");
  expect(question).toContain("Logitech G305 Lightspeed");
  expect(question).toContain("5680000");
  expect(question).toContain("DEMO");
  expect(question).toContain("UNKNOWN");
  expect(question.length).toBeLessThanOrEqual(4000);
});
it("rejects fabricated IDs and empty builds instead of sending invalid context", () => {
  expect(() => buildQuestion({CPU: "fake"}, "en")).toThrow();
  expect(() => buildQuestion({}, "en")).toThrow();
});
