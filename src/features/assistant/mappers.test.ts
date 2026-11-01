import {expect, it} from "vitest";

import {mapProductCard} from "./mappers";

it("keeps an unavailable AI catalog price unknown instead of showing zero", () => {
  expect(mapProductCard({name: "GPU", list_price: null}).list_price).toBeUndefined();
  expect(mapProductCard({name: "GPU", list_price: 0}).list_price).toBe(0);
});
