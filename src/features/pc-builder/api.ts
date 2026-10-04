import {z} from "zod";
import {apiFetch} from "@/lib/api/client";
import {candidatesSchema, componentSchema, quoteSchema, type Selection, type Slot} from "./contracts";
import {toPart, toQuote} from "./mappers";

export async function getComponents(slot: Slot, signal?: AbortSignal) {
  return z.array(componentSchema).parse(await apiFetch<unknown>(`/api/mock/pc-builder/components?slot=${slot}`, {signal})).map(toPart);
}
export async function getAccessories(signal?: AbortSignal) {
  return z.array(componentSchema).parse(await apiFetch<unknown>("/api/mock/pc-builder/accessories", {signal})).map(toPart);
}
export async function getCandidates(selection: Selection, slot: Slot, signal?: AbortSignal) {
  return candidatesSchema.parse(await apiFetch<unknown>("/api/mock/pc-builder/validate", {method: "POST", body: JSON.stringify({selection, slot}), signal}));
}
export async function getQuote(selection: Selection, signal?: AbortSignal) {
  return toQuote(quoteSchema.parse(await apiFetch<unknown>("/api/mock/pc-builder/quote", {method: "POST", body: JSON.stringify({selection}), signal})));
}
