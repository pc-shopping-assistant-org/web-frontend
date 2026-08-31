import {fileURLToPath} from "node:url";
import path from "node:path";

import react from "@vitejs/plugin-react";
import {defineConfig} from "vitest/config";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {alias: {"@": path.resolve(configDirectory, "./src")}},
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
