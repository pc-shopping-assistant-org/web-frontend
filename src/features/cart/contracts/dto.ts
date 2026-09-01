import type {BackendSchema} from "@/lib/api/generated/types";

/** OpenAPI transport shapes kept inside the cart adapter boundary. */
export type CartItemDto = BackendSchema["CartItemResponse"];
export type CartDto = BackendSchema["CartResponse"];
