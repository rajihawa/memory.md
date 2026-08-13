---
name: memory
description: >
  The memory.md protocol: a persistent, low-token project memory made of plain
  Markdown (MEMORY.md index, .memory/core small memories, .memory/context
  line-indexed files). Use when the user says "remember", "recall", "save to
  memory", "memory.md", "MEMORY.md", ".memory", or when a task produces
  durable knowledge (decisions, conventions, gotchas) that should be
  persisted, or when browsing what is already known about the project.
---

# memory.md — project memory protocol

A persistent, low-token, high-precision project memory. Plain Markdown only:
no binaries, no parsers, no special formats. Line numbers are the only
indexing mechanism.

## Layout

```text
project/
├── MEMORY.md                  # root index: one line per core memory
└── .memory/
    ├── core/                  # small, named memories, read entirely
    └── context/               # large, line-indexed context files
```

- `MEMORY.md` is the first thing read: it decides which core file to open.
- Core files are small (< ~50 lines), named by topic, read fully when chosen,
  and may reference context ranges (`Context reference: context/<file>.md#L41-L65`).
- Context files are large and append-friendly. They are never read whole.

## Context file format

Line 1 is a single pointer; the lines it names are the guide (table of
contents) mapping topics to exact line ranges in the same file:

```markdown
<!-- @guide 2-15 -->
# API Design Context

## Guide
- Database layer: lines 16-40
- Endpoints: lines 41-65
- Auth: lines 66-80

## Database layer
... detailed content ...
```

### Retrieval (what the memory_recall tool does)

1. Read line 1 to find the guide range.
2. Read only the guide lines.
3. Find the topic and its line range.
4. Fetch only that range.

## Core file format

```markdown
# Database Decision

type: core
tags: #db #decision

Decision: Use Postgres 16.

Context reference: context/api-design.md#L41-L65
```

## remember flow (remember + reindex in one operation)

1. **Browse first** with the memory_recall tool — never duplicate existing
   memories.
2. **Place**: small focused knowledge → new or existing core file; large
   content → new or existing context file. A core file can point into a
   context file with a `Context reference:` line.
3. **Write** concisely.
4. **Index**: add/update the one-line entry in `MEMORY.md` (context files are
   never listed there).
5. **Reindex**: whenever a context file's lines shift (or a new one is born),
   update its line-1 `<!-- @guide a-b -->` pointer and regenerate the guide
   section from its headings so every topic still points at the right range.
   In-place text edits in a core file do not shift context ranges.

## Design principles

- Core = small, named, read entirely.
- Context = large, line-indexed, fetched precisely.
- `MEMORY.md` = curated index of core memories only.
- Append-friendly: context files grow without breaking references as long as
  the guide is reindexed when lines shift.

## After a task

When work produced durable knowledge (decisions, conventions, architecture
notes, debugging gotchas), ask the user (question tool): "Save this to
memory.md?" On yes, run the remember flow. Skip for trivial fixes.
