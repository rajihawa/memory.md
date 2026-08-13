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
| `/memory` | Initialize the system if missing; report the memory state. |
| `/memory-remember <title> [body]` | Save a memory: place it, update the index, reindex context guides. |
| `/memory-help` | This card. |

## Context files

Line 1 is a pointer (`<!-- @guide 2-15 -->`); the guide section maps topics to line ranges. Fetch only the needed range.

## After a task

The agent should automatically ask: "Save this to memory.md?" when the task produced durable knowledge (decisions, conventions, gotchas). Accept to trigger the remember flow.
