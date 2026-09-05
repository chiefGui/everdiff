# Everdiff

A Bun monorepo with a separate Electron shell and a pure React UI.
The app currently renders **Hello world**.

```text
apps/
  everdiff-web/          React, routes, StyleX, browser assets
  everdiff-electron/     Effect desktop adapter, main entry, Forge, build hooks
scripts/                Renderer size budget
```

## Development

Use Bun **1.4.2** (`bun upgrade`) and Node **24.11+** for the Vite+ and TypeScript
CLI entrypoints. Bun is pinned in `packageManager` and `.bun-version`.

```sh
bun install
bun run dev       # Electron + the web dev server, with React/StyleX HMR
bun run dev:web   # Browser only: http://127.0.0.1:5173
```

Run one dev command at a time; both use port 5173. Restart `bun run dev` after
changing Electron source or build configuration. Renderer edits update live.

```sh
bun run check      # TypeScript 7, Oxlint, formatting, lifecycle tests
bun run fmt        # Format source and configuration
bun run build      # Build main + renderer, then enforce renderer size budgets
bun run size       # Check built renderer gzip budgets
bun run build:web  # Standalone web build in apps/everdiff-web/dist/
bun run package   # Package for the current OS and architecture
bun run make      # Package and create a ZIP in apps/everdiff-electron/out/make/
```

The generated TanStack `routeTree.gen.ts` is included so typechecking works
immediately after installation. Vite+ updates it when routes change.

## Versions

Direct dependencies use exact versions resolved from npm on September 5, 2026.
The lockfile pins the full dependency graph.

| Component                | Version      |
| ------------------------ | ------------ |
| Bun                      | 1.4.2        |
| Electron                 | 44.2.0       |
| Electron Forge           | 7.11.2       |
| React / React DOM        | 19.2.8       |
| TypeScript               | 7.0.2        |
| Effect / Node platform   | 4.0.0-rc.112 |
| TanStack Router          | 1.170.32     |
| TanStack Router plugin   | 1.168.35     |
| StyleX / compiler plugin | 0.19.0       |
| Vite+                    | 0.3.0        |
| Ariakit                  | 0.4.39       |
| Motion                   | 13.2.0       |

Effect uses the requested RC channel; the other stack packages use their latest
stable releases. TypeScript 7 is available as `typescript`, with the native `tsc`
binary; no preview package is needed.

Compatibility details:

- Bun's isolated linker gives Forge a package-local Electron dependency. Forge
  7's hoisted dependency discovery does not recognize `bun.lock`.
- Forge and build hooks run with Bun. This also avoids an archive extraction
  failure observed with the host's Node 26.3.0.
- Vite resolves to Vite+'s core through an npm alias override, as required by
  [Vite+](https://viteplus.dev/guide/migrate). There is no separate vanilla Vite
  toolchain. Forge uses its public hooks to call Vite+ directly.
- StyleX 0.19 requires `unplugin` 2.x, so that compiler peer is pinned to the
  newest compatible version, 2.3.11.
- Electron fuses are configured directly with the latest `@electron/fuses`
  2.1.3; Forge 7's fuses plugin still requires the older 1.x API.

## Boundaries and performance

`Desktop` is an Effect `Context.Service` with a scoped `Layer`. It owns Electron
listeners and the window; `Effect.acquireRelease` cleans them up on quit,
interruption, and startup failure. An Effect queue serializes lifecycle events.
`NodeRuntime.runMain` is the single execution boundary, with Electron exiting
after finalizers finish. Electron embeds Node; Bun runs development tooling.

The web app has no Electron imports, preload dependency, or IPC. A lint rule
enforces this boundary. Add narrowly scoped preload methods and Schema-validated
contracts when desktop capabilities are needed. Keep future domain behavior in
Effect services, provide platform adapters through Layers, and execute at router
loaders or other framework boundaries. Read the local Effect guide in `AGENTS.md`
before adding Effect code.

The React view stays pure. Effect and Motion are installed in the web workspace
for future behavior but contribute no runtime bytes to this static screen.
When adding animation, use Motion's selective imports or `LazyMotion` with `m`
and honor reduced motion. See [Motion's bundle guidance](https://motion.dev/docs/react-reduce-bundle-size).

StyleX extracts atomic CSS at build time, TanStack splits route components, and
system fonts avoid font downloads. There are no devtools, polling loops, or
animation providers in the production renderer. Hash history and relative asset
paths let the same frontend run over HTTP and Electron's packaged file URL.

`bun run size` checks **all** renderer JavaScript chunks against 100 KiB gzip and
CSS against 8 KiB gzip. The initial build is about **86.2 KiB JS** and **0.4 KiB
CSS**. These are transfer-size budgets, not startup latency benchmarks.

Electron uses a sandboxed, isolated renderer without Node integration; new
windows, navigation, webviews, and permissions are denied. Packaged builds use
an ASAR archive and hardened fuses. The current ZIP is a local development
artifact; signing, notarization, icons, installers, and updates are future work.

## Verified

Typechecking, linting, formatting, three Effect lifecycle tests, production
builds, size budgets, and a macOS x64 ZIP build pass. The standalone browser
preview and packaged desktop renderer show Hello world with extracted styles.
Packaging on Windows and Linux has not been exercised.
