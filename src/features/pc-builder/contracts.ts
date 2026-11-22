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
export const BuildGoal = {
  GAMING: "gaming",
  CREATOR: "creator",
  OFFICE: "office",
} as const;
export type BuildGoal = (typeof BuildGoal)[keyof typeof BuildGoal];
export const buildGoals: readonly BuildGoal[] = Object.values(BuildGoal);

export const UseCaseProfile = {
  GAMING_1080P: "GAMING_1080P",
  GAMING_1440P: "GAMING_1440P",
  GAMING_4K: "GAMING_4K",
  CONTENT_CREATION_3D: "CONTENT_CREATION_3D",
  AI_DATA_SCIENCE: "AI_DATA_SCIENCE",
  OFFICE_BUDGET: "OFFICE_BUDGET",
} as const;
export type UseCaseProfile = (typeof UseCaseProfile)[keyof typeof UseCaseProfile];
export const useCaseProfiles: readonly UseCaseProfile[] = Object.values(UseCaseProfile);

export const BuildObjective = {
  PERFORMANCE: "PERFORMANCE",
  BALANCED: "BALANCED",
  UPGRADE_FRIENDLY: "UPGRADE_FRIENDLY",
} as const;
export type BuildObjective = (typeof BuildObjective)[keyof typeof BuildObjective];
export const buildObjectives: readonly BuildObjective[] = Object.values(BuildObjective);

export const CheckVerdict = {
  COMPATIBLE: "COMPATIBLE",
  INCOMPATIBLE: "INCOMPATIBLE",
  UNKNOWN: "UNKNOWN",
} as const;
export type CheckVerdict = (typeof CheckVerdict)[keyof typeof CheckVerdict];

export const BuilderTab = {
  CORE: "core",
  PERIPHERALS: "peripherals",
  ALL: "all",
} as const;
export type BuilderTab = (typeof BuilderTab)[keyof typeof BuilderTab];

export const PickerSort = {
  PRICE_ASC: "price_asc",
  PRICE_DESC: "price_desc",
} as const;
export type PickerSort = (typeof PickerSort)[keyof typeof PickerSort];

export const selectionSchema = z.partialRecord(z.enum(slots), z.uuid());
export type Selection = z.infer<typeof selectionSchema>;
