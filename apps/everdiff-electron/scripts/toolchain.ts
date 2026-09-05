import { fileURLToPath } from "node:url";
import { build, createServer } from "vite-plus";

const desktopRoot = fileURLToPath(new URL("../", import.meta.url));
const webRoot = fileURLToPath(new URL("../../everdiff-web/", import.meta.url));

export async function buildMain() {
  await build({ root: desktopRoot, configFile: `${desktopRoot}/vite.config.ts` });
}

export async function buildApp() {
  await buildMain();
  await build({
    root: webRoot,
    configFile: `${webRoot}/vite.config.ts`,
    build: { outDir: `${desktopRoot}/dist/renderer`, emptyOutDir: true },
  });
}

export async function startWebServer() {
  const server = await createServer({
    root: webRoot,
    configFile: `${webRoot}/vite.config.ts`,
  });
  try {
    await server.listen();
    return server;
  } catch (error) {
    await server.close();
    throw error;
  }
}
