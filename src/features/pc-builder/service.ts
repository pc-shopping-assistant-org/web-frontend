import {components} from "./fixtures";
import {selectionSchema, coreSlots, type Selection, type Slot, type QuoteDto} from "./contracts";

export function quoteBuild(input: Selection): QuoteDto {
  const selection = selectionSchema.parse(input);
  const items = Object.entries(selection).map(([slot, id]) => {
    const part = components.find(p => p.id === id && p.slot === slot && p.quantity > 0);
    if (!part) throw new Error("INVALID_COMPONENT_SELECTION");
    return part;
  });
  const specs = (slot: string) => items.find(p => p.slot === slot)?.specifications;
  const checks: QuoteDto["checks"] = [];
  function check(code: string, pair: QuoteDto["checks"][number]["slots"], a: unknown, b: unknown, matches: (a: string | number, b: string | number) => boolean) {
    checks.push({code, slots: pair, status: a == null || b == null ? "UNKNOWN" : matches(a as string | number, b as string | number) ? "COMPATIBLE" : "INCOMPATIBLE"});
  }
  check("CPU_SOCKET", ["CPU", "MAINBOARD"], specs("CPU")?.socket, specs("MAINBOARD")?.socket, (a, b) => a === b);
  check("RAM_TYPE", ["RAM", "MAINBOARD"], specs("RAM")?.ram_type, specs("MAINBOARD")?.ram_type, (a, b) => a === b);
  check("BOARD_CASE", ["MAINBOARD", "CASE"], specs("MAINBOARD")?.form_factor, specs("CASE")?.supported_form_factors, (a, b) => String(b).split(",").includes(String(a)));
  check("GPU_CLEARANCE", ["GPU", "CASE"], specs("GPU")?.gpu_length_mm, specs("CASE")?.max_gpu_length_mm, (a, b) => Number(a) <= Number(b));
  check("COOLER_SOCKET", ["CPU", "COOLER"], specs("CPU")?.socket, specs("COOLER")?.supported_sockets, (a, b) => String(b).split(",").includes(String(a)));
  // PSU wattage alone cannot prove system power/connector requirements.
  checks.push({code: "PSU_CAPACITY", slots: ["PSU", "GPU", "CPU"], status: "UNKNOWN"});
  checks.push({code: "SSD_INTERFACE", slots: ["SSD", "MAINBOARD"], status: "UNKNOWN"});
  checks.push({code: "COOLER_CLEARANCE", slots: ["COOLER", "CASE"], status: "UNKNOWN"});
  return {items, total: items.reduce((sum, p) => sum + p.listPrice, 0), missingSlots: coreSlots.filter(slot => !selection[slot]), checks};
}

export function validateCandidates(selection: Selection, slot: Slot) {
  quoteBuild(selection); // Reject invalid existing IDs instead of masking them.
  return Object.fromEntries(components.filter(part => part.slot === slot).map(part => {
    const checks = quoteBuild({...selection, [slot]: part.id}).checks.filter(check => check.slots.includes(slot));
    const status = checks.some(c => c.status === "INCOMPATIBLE") ? "INCOMPATIBLE" : !checks.length || checks.some(c => c.status === "UNKNOWN") ? "UNKNOWN" : "COMPATIBLE";
    return [part.id, status];
  }));
}
