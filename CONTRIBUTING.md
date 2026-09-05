# Contributing

Use Bun from `package.json` and Node.js from `.node-version`. Follow [AGENTS.md](AGENTS.md).

- `bun install --frozen-lockfile`: install dependencies and Git hooks.
- `bun run staged`: format and lint staged files; preserve unstaged changes.
- `bun run check`: CI's formatting, lint, build, type checks, and unit tests.

Inspect hooks with `bun run vp hooks status`. Use `bun run vp hooks disable` or
`bun run vp hooks enable` to change their state. Disabling survives reinstalls.

Use Conventional Commit PR titles, such as `feat: open a repository`, and squash
with the PR title as the commit subject. Title edits run validation independently
of the build.
