import {z} from "zod";

export const publicConfigSchema = z.object({
  googleClientId: z.string().nullable(),
});

export type PublicConfig = z.infer<typeof publicConfigSchema>;
export const publicConfigKeys = {all: ["public-config"] as const};
export const PUBLIC_CONFIG_PATH = "/api/config";
