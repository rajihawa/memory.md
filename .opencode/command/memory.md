---
description: Initialize or report the state of the project's memory.md system
---

Set up the project's memory system if it is missing, then report its state.

1. If MEMORY.md does not exist at the project root, create:
   - `MEMORY.md` with a `# Project Memory` heading and a `## Core Memory Index` section
   - `.memory/core/` and `.memory/context/` directories
2. Report the state:
   - List every entry in the MEMORY.md index (core memory name + one-line description)
   - For each file in `.memory/context/`, show its `@guide` pointer (line 1) so the user knows what context exists
   - If the memory system already exists and is in good shape, just report it; do not modify anything.

Read the memory skill first if you need the full layout rules.
