import {z} from "zod";

const serverEnvSchema = z.object({
  BACKEND_API_URL: z.string().url().default("http://localhost:8080/api/v1"),
  AI_API_URL: z.string().url().default("http://localhost:8000/api/v1"),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    BACKEND_API_URL: process.env.BACKEND_API_URL,
    AI_API_URL: process.env.AI_API_URL,
  });
}
