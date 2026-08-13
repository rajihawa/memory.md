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

Add to your `opencode.json`:

```json
{ "plugin": ["@rajihawa/memory.md"] }
```

Or run from a checkout (the plugin reuses `hooks/` and `skills/`):

```json
{ "plugin": ["./.opencode/plugins/memory.md.mjs"] }
```

The plugin registers the `memory_recall` tool, the `/memory*` commands, and
the `memory` skill, and injects the protocol into the system prompt whenever
the project has a `MEMORY.md` (zero cost in projects without one). opencode
also auto-loads this repo's `AGENTS.md`, so the protocol holds from a checkout
even without the plugin.

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

Pushing to `main` auto-publishes to GitHub Packages (`.github/workflows/publish.yml`):
tests run, the patch version bumps, the package publishes, and the bump is
committed back. Auth uses the automatic `GITHUB_TOKEN` — no secrets to set up.

Install from GitHub Packages needs a `.npmrc` pointing at the registry:

```ini
@rajihawa:registry=https://npm.pkg.github.com
```

## License

[MIT](LICENSE).
