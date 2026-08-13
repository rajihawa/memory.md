---
description: Report on the project's memory.md system — version, index, sizes
---

Report the state of the project's memory system. One-shot; do not modify
anything.

1. If MEMORY.md does not exist, say there is no memory system yet and point
   at /memory-init to create one.
2. Otherwise report:
   - Plugin version: {{version}}
   - Root: where MEMORY.md was found
   - MEMORY.md index: number of entries, then list them (name + description)
   - Core memories: count, and for each file its lines and size
   - Context files: count, and for each file its @guide pointer (line 1),
     lines and size
   - Totals: total memory size (du -sh .memory), total lines
3. Do not modify anything, do not reindex, do not distil — this is a report
   only. /memory-init does the maintenance.
