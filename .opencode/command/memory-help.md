---
description: Quick reference for the memory.md system (tool, commands, layout)
---

Show the quick reference card. One-shot; do not modify anything.

## Layout

```text
project/
├── MEMORY.md                  # index of core memories (one line each)
└── .memory/
    ├── core/                  # small memories (< ~50 lines), read entirely
    └── context/               # large files, line-indexed; never read whole
```

## Tool

- `memory_recall` — browse the memory. Query: a topic, or `file.md#L41-L65` for an exact range fetch. Uses ripgrep (fallback grep) and sed; Linux only.

## Commands

| Command | What it does |
|---------|--------------|
| `/memory-init` | (Re)build the core memory layer: scan the project into basic core memories; on re-run, distill `.memory/context/` into the cores and delete the context files. |
| `/memory-remember <title> [body]` | Save a memory: place it, update the index, reindex context guides. |
| `/memory-info` | Report: plugin version, index entries, core/context counts, sizes. |
| `/memory-help` | This card. |

## The cycle

`/memory-init` seeds basic core memories → tasks build up context → the next
`/memory-init` distills context into stronger cores and frees the context.
Run it every so often.

## Context files

Line 1 is a pointer (`<!-- @guide 2-15 -->`); the guide section maps topics to line ranges. Fetch only the needed range.

## After a task

The agent should automatically ask: "Save this to memory.md?" when the task produced durable knowledge (decisions, conventions, gotchas). Accept to trigger the remember flow.
