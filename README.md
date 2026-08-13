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
2. **`/memory-init`** — (re)builds the core memory layer: on a fresh project
   it scans the codebase and seeds basic core memories (stack, conventions,
   architecture, workflows, status); re-run it later and it distills the
   accumulated `.memory/context/` into stronger core memories and deletes the
   context files — the cycle continues.
3. **`/memory-remember`** — saves a memory: browses first, places it in the
   right core or context file, updates the `MEMORY.md` index, and reindexes
   any context guide whose ranges shifted. Remembering IS reindexing.
4. **`/memory-info`** — reports the system: plugin version, index entries,
   core/context counts and sizes.
5. **After every task** that produced durable knowledge, the agent
   automatically asks: *"Save this to memory.md?"* — accept and the remember
   flow runs. The plugin also pre-fills the prompt with the offer when a
   session goes idle, so the ask never gets skipped.

## Install

Add to your `opencode.json` (project or `~/.config/opencode/opencode.json`):

```json
{ "plugin": ["git+https://github.com/rajihawa/memory.md"] }
```

Install via git — no registry, no tokens, no `.npmrc`, no publishing. The repo
is public, so every install pulls the latest `main` anonymously. (`npm i
git+https://github.com/rajihawa/memory.md` works the same way for non-opencode
use.)

Or run from a checkout (the plugin reuses `hooks/` and `skills/`):

```json
{ "plugin": ["./.opencode/plugins/memory.md.mjs"] }
```

The plugin activates per project, like `AGENTS.md`: the protocol injection,
the `/memory-remember`, `/memory-info` and `/memory-help` commands, the
`memory` skill, and the save-session nudge only exist where a `MEMORY.md` is
found walking up from the project root. `/memory-init` is always available (it
is how a project bootstraps), and `memory_recall` replies with an init pointer
where no memory exists.
opencode also auto-loads this repo's `AGENTS.md`, so the protocol holds from a
checkout even without the plugin.

Start a new session after changing config.

## Commands

| Command | What it does |
|---------|--------------|
| `/memory-init` | (Re)build the core memory layer: scan the project into basic core memories; on re-run, distill `.memory/context/` into the cores and delete the context files. |
| `/memory-remember <title> [body]` | Save a memory: place it, update the index, reindex context guides. |
| `/memory-info` | Report: plugin version, index entries, core/context counts, sizes. |
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

## License

[MIT](LICENSE).
