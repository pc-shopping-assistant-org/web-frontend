import {z} from "zod";

export const Slot = {CPU: "CPU", MAINBOARD: "MAINBOARD", RAM: "RAM", GPU: "GPU", SSD: "SSD", PSU: "PSU", CASE: "CASE", COOLER: "COOLER", MONITOR: "MONITOR", MOUSE: "MOUSE", KEYBOARD: "KEYBOARD", HEADSET: "HEADSET"} as const;
export type Slot = typeof Slot[keyof typeof Slot];
export const slots = Object.values(Slot);
export const coreSlots: Slot[] = [Slot.CPU, Slot.MAINBOARD, Slot.RAM, Slot.GPU, Slot.SSD, Slot.PSU, Slot.CASE, Slot.COOLER];
export const optionalSlots: Slot[] = [Slot.MONITOR, Slot.MOUSE, Slot.KEYBOARD, Slot.HEADSET];
export const slotGroups = [{id: "core", slots: coreSlots}, {id: "peripherals", slots: optionalSlots}] as const;
export const selectionSchema = z.partialRecord(z.enum(slots), z.string().min(1).max(80));
export const buildRequestSchema = z.object({selection: selectionSchema}).strict();
export const candidatesRequestSchema = buildRequestSchema.extend({slot: z.enum(slots)});
export const candidatesSchema = z.record(z.string(), z.enum(["COMPATIBLE", "INCOMPATIBLE", "UNKNOWN"]));
export type Selection = z.infer<typeof selectionSchema>;
export const componentSchema = z.object({
  id: z.string(), productId: z.string(), sku: z.string(), name: z.string(),
  slot: z.enum(slots), brand: z.string(), listPrice: z.number().int().nonnegative(),
  quantity: z.number().int().nonnegative(), specifications: z.record(z.string(), z.union([z.string(), z.number()])),
});
export const checkSchema = z.object({code: z.string(), status: z.enum(["COMPATIBLE", "INCOMPATIBLE", "UNKNOWN"]), slots: z.array(z.enum(slots))});
export const quoteSchema = z.object({total: z.number().int().nonnegative(), items: z.array(componentSchema), missingSlots: z.array(z.enum(slots)), checks: z.array(checkSchema)});
export type ComponentDto = z.infer<typeof componentSchema>;
export type QuoteDto = z.infer<typeof quoteSchema>;
