import type {
  components as AiComponents,
  paths as AiPaths,
} from "@/lib/api/generated/ai";
import type {
  components as BackendComponents,
  paths as BackendPaths,
} from "@/lib/api/generated/backend";

/** Type-only OpenAPI snapshot access. Do not edit the generated sources. */
export type BackendSchema = BackendComponents["schemas"];
export type AiSchema = AiComponents["schemas"];
export type BackendPath = BackendPaths;
export type AiPath = AiPaths;
