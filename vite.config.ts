import { builtinModules } from "node:module";
import { defineConfig } from "vite-plus";

const generated = ["**/dist/**", "**/out/**", "**/routeTree.gen.ts"];

export default defineConfig({
  test: {
    include: ["apps/**/*.test.ts"],
    environment: "node",
    restoreMocks: true,
  },
  lint: {
    ignorePatterns: generated,
    plugins: ["typescript", "react", "import"],
    rules: { "typescript/no-explicit-any": "error" },
    overrides: [
      {
        files: ["apps/everdiff-web/src/**"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: [...builtinModules, "electron", "bun"],
              patterns: [
                {
                  group: [
                    "node:*",
                    "bun:*",
                    "electron/*",
                    "@everdiff/electron",
                    "@everdiff/electron/*",
                    "**/everdiff-electron/**",
                  ],
                  message: "The web app must stay independent of desktop and server APIs.",
                },
              ],
            },
          ],
        },
      },
    ],
  },
  fmt: { ignorePatterns: [...generated, "bun.lock"], semi: true, printWidth: 100 },
});
