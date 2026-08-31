"use client";

import {useQuery} from "@tanstack/react-query";

import {getCart} from "./api";

export const cartKeys = {all: ["cart"] as const};

export function useCart() {
  return useQuery({queryKey: cartKeys.all, queryFn: getCart});
}
