# memory.md

*He remembers. So you don't have to.*

A persistent, low-token project memory for opencode, made of plain Markdown.
No binaries, no parsers, no special formats — line numbers are the only
indexing mechanism.

## What it is

```text
project/
├── MEMORY.md                  # root index: one line per core memory
└── .memory/
    ├── core/                  # small memories (< ~50 lines), read entirely
    └── context/               # large files, line-indexed; never read whole
```

- **Core memories** are small, named by topic, read entirely when needed. They
  can point into context files: `Context reference: context/api-design.md#L41-L65`.
- **Context files** are large and append-friendly. Line 1 is a guide pointer
  (`<!-- @guide 2-15 -->`); the guide maps topics to exact line ranges, so an
  agent fetches only the lines it needs.
- **`MEMORY.md`** is the map: one line per core memory. Read it first, open
  the matching core, fetch the context range only if needed.

## How the agent uses it

1. **`memory_recall`** — a tool that browses the memory with OS default tools
   (ripgrep when found, else `grep -rn`; `sed` for ranges; Linux only). Pass a
   topic to search index + cores (read in full) + context (guide + windows
   around hits), or `api-design.md#L41-L65` to fetch exactly those lines. Path
   escapes from the memory dir are refused.
2. **`/memory-remember`** — saves a memory: browses first, places it in the
   right core or context file, updates the `MEMORY.md` index, and reindexes
   any context guide whose ranges shifted. Remembering IS reindexing.
3. **After every task** that produced durable knowledge, the agent
   automatically asks: *"Save this to memory.md?"* — accept and the remember
   flow runs. The plugin also pre-fills the prompt with the offer when a
   session goes idle, so the ask never gets skipped.

## Install

Add to your `opencode.json` — no registry config, no tokens:

```json
{ "plugin": ["@rajihawa/memory.md"] }
```

Or run from a checkout (the plugin reuses `hooks/` and `skills/`):

```json
{ "plugin": ["./.opencode/plugins/memory.md.mjs"] }
```

The plugin activates per project, like `AGENTS.md`: the protocol injection,
the `/memory-remember` and `/memory-help` commands, the `memory` skill, and the
save-session nudge only exist where a `MEMORY.md` is found walking up from the
project root. `/memory` is always available (it is how a project bootstraps),
and `memory_recall` replies with an init pointer where no memory exists.

Start a new session after changing config.

## Commands

| Command | What it does |
|---------|--------------|
| `/memory` | Initialize the system if missing; report the memory state. |
| `/memory-remember <title> [body]` | Save a memory: place it, update the index, reindex context guides. |
| `/memory-help` | Quick reference card. |

## Design principles

- **Core = small, named, read entirely.** Context = large, line-indexed, fetched precisely.
- **`MEMORY.md` = curated index** of core memories only; context files are referenced from core files, never listed.
- **Append-friendly** — context files grow without breaking references, as long as the guide is reindexed when lines shift.
- **Tool-agnostic** — anything that can read a file can use it.

## Development

```bash
npm test
```

The suite checks: `AGENTS.md` stays in sync with the injected instructions,
the command files parse and register, and `memory_recall` behaves against a
fixture memory tree (search, exact range fetch, path-escape refusal, missing
memory system) — with the real OS tools.

## Deploy

Publishing a version tag publishes to npmjs via OIDC trusted publishing
(`.github/workflows/publish.yml`): tests run, then `npm publish` with no token
(`id-token: write`, provenance attached automatically). Cut a release with:

```bash
npm version patch
git push --follow-tags
```

One-time setup on npmjs.com: your account must own the `@rajihawa` scope, and
you must add the **Trusted Publisher** (owner `rajihawa`, repo `memory.md`,
workflow `publish.yml`) under your account settings. The first version is
published manually (`npm login && npm publish`); the workflow handles every
release after that.

## License

[MIT](LICENSE).
