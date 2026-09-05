import path from "node:path";
import { MakerZIP } from "@electron-forge/maker-zip";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { flipFuses, FuseV1Options, FuseVersion } from "@electron/fuses";
import type { ViteDevServer } from "vite-plus";
import { buildApp, buildMain, startWebServer } from "./scripts/toolchain.ts";

let server: ViteDevServer | undefined;

const config: ForgeConfig = {
  packagerConfig: {
    name: "Everdiff",
    executableName: "everdiff",
    appBundleId: "app.everdiff.desktop",
    asar: true,
    // Runtime dependencies are bundled. Ship only the build and app manifest.
    ignore: (file) => file !== "" && file !== "/package.json" && !/^\/dist(?:\/|$)/.test(file),
  },
  makers: [new MakerZIP({}, ["darwin", "linux", "win32"])],
  hooks: {
    preStart: async () => {
      await buildMain();
      server ??= await startWebServer();
      process.env.EVERDIFF_RENDERER_URL = server.resolvedUrls?.local[0];
    },
    postStart: async (_config, child) => {
      child.once("exit", () => {
        if (!child.restarted) {
          void server?.close();
          server = undefined;
        }
      });
    },
    prePackage: async () => {
      await buildApp();
    },
    packageAfterExtract: async (_config, buildPath, _version, platform) => {
      const executable =
        platform === "darwin" ? "Electron.app" : platform === "win32" ? "electron.exe" : "electron";
      await flipFuses(path.join(buildPath, executable), {
        version: FuseVersion.V1,
        resetAdHocDarwinSignature: platform === "darwin",
        [FuseV1Options.RunAsNode]: false,
        [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
        [FuseV1Options.EnableNodeCliInspectArguments]: false,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
        [FuseV1Options.OnlyLoadAppFromAsar]: true,
      });
    },
  },
};

export default config;
