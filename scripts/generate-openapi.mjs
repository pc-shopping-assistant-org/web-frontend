import { mkdir, readFile, rm, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";

const execFileAsync = promisify(execFile);
const root = resolve(new URL("..", import.meta.url).pathname);
const checkOnly = process.argv.includes("--check");
const generator = resolve(root, "node_modules/.bin/openapi-typescript");

const targets = [
  {
    name: "backend",
    input: resolve(root, "src/lib/api/openapi/backend.openapi.json"),
    output: resolve(root, "src/lib/api/generated/backend.ts"),
  },
  {
    name: "ai",
    input: resolve(root, "src/lib/api/openapi/ai.openapi.json"),
    output: resolve(root, "src/lib/api/generated/ai.ts"),
  },
];

async function assertFile(path, label) {
  try {
    await stat(path);
  } catch {
    throw new Error(`Missing ${label}: ${path}. Run yarn api:refresh first.`);
  }
}

async function generate(target, outputPath) {
  await mkdir(dirname(outputPath), { recursive: true });
  await execFileAsync(generator, [
    target.input,
    "--output",
    outputPath,
    "--alphabetize",
    "--export-type",
    "--empty-objects-unknown",
  ]);
}

for (const target of targets) {
  await assertFile(target.input, `${target.name} OpenAPI snapshot`);

  if (checkOnly) {
    await assertFile(target.output, `${target.name} generated types`);
    const temporaryOutput = `${target.output}.check.tmp`;
    try {
      await generate(target, temporaryOutput);
      const [expected, actual] = await Promise.all([
        readFile(target.output, "utf8"),
        readFile(temporaryOutput, "utf8"),
      ]);
      if (expected !== actual) {
        throw new Error(
          `${target.name} generated types are stale. Run yarn api:generate and commit the result.`,
        );
      }
      console.log(`OpenAPI types are up to date: ${target.name}`);
    } finally {
      await rm(temporaryOutput, { force: true });
    }
    continue;
  }

  await generate(target, target.output);
  console.log(`Generated ${target.name} OpenAPI types: ${target.output}`);
}
