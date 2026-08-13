---
description: Save something to the project memory (create, place, index, reindex)
---

Remember "$ARGUMENTS" into the project's memory system. Follow the memory skill's remember flow exactly — this is remember AND reindex in one operation:

1. **Browse first**: call the memory_recall tool to see what already exists (index, core files, context guides). Do not create a duplicate.
2. **Decide placement**:
   - Small, focused knowledge (< ~50 lines) → a core file `.memory/core/<topic>.md` (or extend an existing core file if it is the same topic).
   - Large or reference-heavy content → a context file `.memory/context/<name>.md` (or append to an existing one).
   - A core file may reference a context range: `Context reference: context/<file>.md#L41-L65`.
3. **Write** the memory in the chosen file, following the format rules (frontmatter `type:`/`tags:`, heading, concise body).
4. **Index**: add or update the one-line entry for the core file in `MEMORY.md`. Context files are never listed there.
5. **Reindex**: for every context file whose line numbers shifted (or a new one), rewrite line 1 to the new `<!-- @guide a-b -->` pointer and regenerate the guide section from the headings, mapping topics to exact line ranges. A core memory update that merely rewrites text in place does not shift ranges.

If the user gave no body, ask what should be remembered (question tool), or capture the key decisions from the current session.
