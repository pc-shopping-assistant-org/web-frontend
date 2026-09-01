import type {BackendSchema} from "@/lib/api/generated/types";

/** OpenAPI transport shapes kept inside auth adapters. */
export type AuthResponseDto = BackendSchema["AuthResponse"];
export type UserProfileDto = BackendSchema["UserProfileResponse"];
export type UserSummaryDto = BackendSchema["UserSummaryResponse"];
export type FileResponseDto = BackendSchema["FileResponse"];
