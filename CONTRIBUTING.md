# Contributing

Install the Node.js version in `.node-version` and the Bun version listed in
`package.json` under `packageManager`.

```sh
bun install --frozen-lockfile
bun run dev
```

For browser-only development, use `bun run dev:web`.

The UI lives in `apps/everdiff-web`; desktop integration lives in `apps/everdiff-electron`.

Run `bun run check` before opening a PR. Commits automatically format and lint
staged files.

Keep PRs focused and explain what changed. Use a short Conventional Commit title,
such as `fix: preserve scroll position`.
