import {backendFetch} from "@/lib/api/client";
import type {Cart} from "@/lib/api/types";

export function getCart() {
  return backendFetch<Cart>("/cart");
}
