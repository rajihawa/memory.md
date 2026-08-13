---
description: (Re)build the project's core memory layer — scan the project, then distill context into cores
---

Run the memory-init flow: initialize the system if missing, then (re)build the
core memory layer from the current project and from accumulated context. This
is the "cycle" command — run it on a fresh project to bootstrap basic core
memories, and run it again later to distill everything learned into stronger
core memories. Read the memory skill's "init / re-init (the cycle)" section
for the exact procedure.

1. **Bootstrap** (only if MEMORY.md does not exist at the project root):
   create `MEMORY.md` (with a `# Project Memory` heading and a `## Core
   Memory Index` section), `.memory/core/` and `.memory/context/`.

2. **Scan the project** and refresh/create the starter core set in
   `.memory/core/`: `stack.md` (languages, frameworks, services, key deps),
   `conventions.md` (style, patterns, tooling), `architecture.md` (layout,
   main modules, data flow), `workflows.md` (build/test/run/lint commands),
   `status.md` (current state). Read README, package.json / lockfile /
   equivalent manifests, config files, and the source tree — excluding
   `.git/`, `node_modules/`, `dist/`, `build/`, `.memory/` and other
   generated directories. Omit cores that do not apply to the project. Keep
   each core under ~50 lines. On re-init, update the existing cores in place
   (same topics, refreshed facts) instead of duplicating.

3. **Distill context** (only if `.memory/context/*.md` files exist): read
   every context file in full (its `@guide` pointer plus all sections), and
   move the durable knowledge into the core layer — extend the matching core
   file when the topic already exists, create a new core file when it does
   not, drop ephemeral detail. Remove `Context reference:` lines that now
   point at files being freed.

4. **Index**: rewrite the MEMORY.md index so it lists every core file, one
   line each, with a one-line description. Context files are never listed.

5. **Free context**: delete every file in `.memory/context/` — the cycle
   continues: new tasks rebuild context, the next run distills it again.

6. **Report** what was created, updated, and deleted. If you just bootstrapped
   the system, tell the user that a restart activates the full memory suite
   (the /memory-remember, /memory-info and /memory-help commands and the
   memory skill); the memory_recall tool already works right away.
