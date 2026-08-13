// memory.md — shared instruction text, single source of truth.
//
// Injected into the system prompt by the opencode plugin whenever the project
// has a MEMORY.md, and mirrored byte-for-byte in AGENTS.md so checkout users
// get the same protocol without the plugin. Keep them in sync — the test
// suite fails if they drift.

const INSTRUCTIONS = `# memory.md protocol

This project keeps a memory system (MEMORY.md + .memory/). Use it.

## Before significant work
Call the memory_recall tool with the task's topic before implementing, designing, or answering anything that may already be decided, documented, or done before.

## During work
Hold onto anything durable you learn — decisions, conventions, constraints, gotchas. You will be offered a chance to save it when the task ends.

## After a task
When the work is done and it produced durable knowledge (decisions, conventions, architecture notes, debugging gotchas), automatically ask the user (question tool): "Save this to memory.md?" If yes, or if the user says remember, follow the remember flow: place the memory in the right spot (a new or existing core file, or a context file for large content), write it, update the MEMORY.md index, and reindex any context file whose guide ranges shifted. See the memory skill for the exact procedure. Do not ask for trivial fixes or chit-chat.

## Layout
- MEMORY.md — root index: one line per core memory.
- .memory/core/*.md — small memories (under ~50 lines), read entirely when needed.
- .memory/context/*.md — large files, never read whole. Line 1 is a guide pointer (<!-- @guide 2-15 -->); the guide maps topics to line ranges. Fetch only the needed ranges.

## Tools
- memory_recall — browse the memory (search, guide, exact line ranges). Use it instead of grep/sed/head on .memory.
- /memory-init — (re)build the core memory layer: scans the project into basic core memories; on re-run it distills .memory/context into the cores and deletes the context files (the cycle: tasks build context, /memory-init distills it into stronger cores).
- /memory-remember — save a new memory; also places and reindexes it.
- /memory-info — memory report: version, index entries, core/context counts and sizes.`;

function getMemoryInstructions() {
  return INSTRUCTIONS;
}

module.exports = { getMemoryInstructions };
