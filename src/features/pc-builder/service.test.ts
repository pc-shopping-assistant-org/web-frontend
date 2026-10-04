import {describe, expect, it} from "vitest";

import {components} from "./fixtures";
import {quoteBuild} from "./service";

describe("mock PC builder", () => {
  it("prices SKU selections on the server", () => {
    const result = quoteBuild({CPU: "cpu-amd", RAM: "ram-ddr5"});
    expect(result.total).toBe(components.find(p => p.id === "cpu-amd")!.listPrice + components.find(p => p.id === "ram-ddr5")!.listPrice);
    expect(result.missingSlots).toContain("MAINBOARD");
  });
  it("includes optional peripherals in the total without making them missing core parts", () => {
    const result = quoteBuild({CPU: "cpu-amd", MOUSE: "mouse-logitech"});
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(4690000 + 990000);
    expect(result.missingSlots).not.toContain("KEYBOARD");
  });
  it("rejects unknown IDs and components in the wrong slot", () => {
    expect(() => quoteBuild({CPU: "missing"})).toThrow();
    expect(() => quoteBuild({CPU: "ram-ddr5"})).toThrow();
  });
  it("detects socket and memory mismatches", () => {
    const result = quoteBuild({CPU: "cpu-amd", MAINBOARD: "board-intel", RAM: "ram-ddr4"});
    expect(result.checks.filter(c => c.status === "INCOMPATIBLE").map(c => c.code)).toEqual(["CPU_SOCKET", "RAM_TYPE"]);
  });
  it("matches known socket, memory and case dimensions without certifying the whole build", () => {
    const result = quoteBuild({CPU: "cpu-amd", MAINBOARD: "board-amd", RAM: "ram-ddr5", GPU: "gpu-rtx", CASE: "case-atx", COOLER: "cooler-air"});
    expect(result.checks.filter(c => c.status === "COMPATIBLE")).toHaveLength(5);
    expect(result.checks.filter(c => c.status === "UNKNOWN")).toHaveLength(3);
  });
  it("never declares unknown data compatible", () => {
    const result = quoteBuild({GPU: "gpu-unknown", CASE: "case-atx"});
    expect(result.checks.find(c => c.code === "GPU_CLEARANCE")?.status).toBe("UNKNOWN");
    expect(result.checks.find(c => c.code === "PSU_CAPACITY")?.status).toBe("UNKNOWN");
  });
  it("detects case size mismatches and avoids pretending to validate PSU sizing", () => {
    const result = quoteBuild({MAINBOARD: "board-intel", CASE: "case-mini", GPU: "gpu-rtx"});
    expect(result.checks.find(c => c.code === "BOARD_CASE")?.status).toBe("INCOMPATIBLE");
    expect(result.checks.find(c => c.code === "GPU_CLEARANCE")?.status).toBe("INCOMPATIBLE");
  });
});
