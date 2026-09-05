import { builtinModules } from "node:module";
import { defineConfig } from "vite-plus";

const generated = ["**/dist/**", "**/out/**", "**/routeTree.gen.ts"];

export default defineConfig({
  // A staged selection can consist entirely of ignored generated files.
  staged: {
    "*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}": [
      "vp lint --fix --deny-warnings --no-error-on-unmatched-pattern",
      "vp fmt --no-error-on-unmatched-pattern",
    ],
    "*.{json,jsonc,yml,yaml,md,mdx,css,scss,html}": "vp fmt --no-error-on-unmatched-pattern",
  },
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
        // Staged checks pass absolute paths to the linter.
        files: ["**/apps/everdiff-web/src/**"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: [...builtinModules, "electron", "bun"],
              patterns: [
                {
                  // Prefixes cover nested subpaths such as node:fs/promises.
                  regex:
                    "^(node:|bun:|electron/|@everdiff/electron(/|$))|(^|/)everdiff-electron(/|$)",
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
