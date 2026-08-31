import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);

const targets = [
  {
    name: "backend",
    url: process.env.BACKEND_OPENAPI_URL ?? "http://localhost:8080/v3/api-docs",
    output: resolve(root, "src/lib/api/openapi/backend.openapi.json"),
  },
  {
    name: "ai",
    url: process.env.AI_OPENAPI_URL ?? "http://localhost:8000/openapi.json",
    output: resolve(root, "src/lib/api/openapi/ai.openapi.json"),
  },
];

async function fetchSpec(target) {
  let response;
  try {
    response = await fetch(target.url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new Error(
      `Unable to fetch ${target.name} OpenAPI from ${target.url}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `${target.name} OpenAPI returned HTTP ${response.status} from ${target.url}`,
    );
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${target.name} OpenAPI response is not valid JSON`);
  }
}

async function writeAtomically(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
}

for (const target of targets) {
  const spec = await fetchSpec(target);
  await writeAtomically(target.output, spec);
  console.log(`Refreshed ${target.name} OpenAPI: ${target.output}`);
}
