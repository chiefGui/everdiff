import { builtinModules } from "node:module";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  build: {
    target: "node24",
    outDir: "dist/main",
    minify: true,
    sourcemap: false,
    lib: {
      entry: "src/main.ts",
      formats: ["cjs"],
      fileName: () => "index.cjs",
    },
    rolldownOptions: {
      external: ["electron", ...builtinModules, ...builtinModules.map((id) => `node:${id}`)],
    },
  },
});
