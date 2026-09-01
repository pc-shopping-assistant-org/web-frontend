/**
 * Compatibility barrel for existing imports.
 *
 * New code should import from bounded-context modules (or `@/lib/domain`)
 * instead of adding unrelated values to one global enum file.
 */
export * from "@/lib/domain/account-enums";
export * from "@/lib/domain/assistant-enums";
export * from "@/lib/domain/catalog-enums";
export * from "@/lib/domain/commerce-enums";
export * from "@/lib/domain/enum-values";
export * from "@/lib/domain/message-keys";
