import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const renderer = new URL("../apps/everdiff-electron/dist/renderer/assets/", import.meta.url);
const files = await readdir(renderer);
const budget = { ".js": 100 * 1024, ".css": 8 * 1024 };

for (const [extension, limit] of Object.entries(budget)) {
  const assets = files.filter((file) => path.extname(file) === extension);
  if (assets.length === 0) throw new Error(`Missing ${extension} assets. Run bun run build first.`);
  let bytes = 0;
  for (const file of assets) bytes += gzipSync(await readFile(new URL(file, renderer))).byteLength;
  console.log(`${extension}: ${(bytes / 1024).toFixed(2)} KiB gzip / ${limit / 1024} KiB budget`);
  if (bytes > limit)
    throw new Error(`${extension} exceeds the renderer budget. Review the bundle.`);
}
