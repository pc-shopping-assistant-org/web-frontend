/**
 * Compatibility barrel for the old request-schema import path.
 *
 * Request contracts now live beside the feature that owns them. Keep this
 * barrel during the migration so existing consumers do not break while new
 * code can import a focused contract module directly.
 */
export * from "@/features/account/contracts/requests";
export * from "@/features/admin/contracts/requests";
export * from "@/features/assistant/contracts/requests";
export * from "@/features/auth/contracts/requests";
export * from "@/features/cart/contracts/requests";
export * from "@/features/catalog/contracts/requests";
export * from "@/features/orders/contracts/requests";
