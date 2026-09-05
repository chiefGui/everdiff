import { fileURLToPath } from "node:url";
import stylex from "@stylexjs/unplugin/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig(({ command }) => ({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./",
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    stylex({ dev: command === "serve", runtimeInjection: false, useCSSLayers: true }),
    react(),
  ],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
  build: { target: "es2024", cssCodeSplit: true, sourcemap: false },
}));
