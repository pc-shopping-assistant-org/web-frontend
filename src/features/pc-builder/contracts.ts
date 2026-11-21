import {z} from "zod";

export const Slot = {
  CPU: "CPU",
  MAINBOARD: "MAINBOARD",
  RAM: "RAM",
  GPU: "GPU",
  SSD: "SSD",
  PSU: "PSU",
  CASE: "CASE",
  COOLER: "COOLER",
  MONITOR: "MONITOR",
  MOUSE: "MOUSE",
  KEYBOARD: "KEYBOARD",
  HEADSET: "HEADSET",
} as const;
export type Slot = (typeof Slot)[keyof typeof Slot];
export const slots = Object.values(Slot);
/** Most units of one part a build can ask for. */
export const MAX_QUANTITY = 10;
export const coreSlots: Slot[] = [Slot.CPU, Slot.MAINBOARD, Slot.RAM, Slot.GPU, Slot.SSD, Slot.PSU, Slot.CASE, Slot.COOLER];
export const optionalSlots: Slot[] = [Slot.MONITOR, Slot.MOUSE, Slot.KEYBOARD, Slot.HEADSET];
export const slotGroups = [
  {id: "core", slots: coreSlots},
  {id: "peripherals", slots: optionalSlots},
] as const;
export const selectionSchema = z.partialRecord(z.enum(slots), z.uuid());
export type Selection = z.infer<typeof selectionSchema>;
