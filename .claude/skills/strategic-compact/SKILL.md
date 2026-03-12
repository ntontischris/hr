---
name: strategic-compact
description: Guidelines for when and how to compact context strategically instead of relying on auto-compact. Preserves critical state while freeing context window. Use when context is getting large or before switching tasks.
---

# Strategic Compaction

## Why Manual > Auto-Compact
Auto-compact loses important context indiscriminately.
Strategic compaction preserves what matters and drops what doesn't.

## When to Compact
- After completing a feature (before starting next)
- After exploration/research phase (before implementation)
- When responses start degrading in quality
- After 30+ back-and-forth messages
- When switching between unrelated tasks

## Compaction Checklist
Before compacting, ensure these are saved:

1. **Current task state** — what's done, what's remaining
2. **Key decisions made** — and WHY (not just what)
3. **File paths modified** — so you can re-read them
4. **Failing test info** — exact error messages
5. **Architectural context** — patterns being followed

## Compaction Command
```
Save current state to .claude/memory.md, then /clear
```

## Memory File Template
```markdown
# Session State — [date]

## Current Task
[What we're building]

## Progress
- [x] Step 1: done
- [x] Step 2: done  
- [ ] Step 3: in progress — [details]
- [ ] Step 4: not started

## Key Decisions
- [Decision]: [Reason]

## Modified Files
- path/to/file.ts — [what changed]

## Blockers / Issues
- [issue description]

## Next Steps
1. [specific next action]
```

## Anti-Patterns
- DON'T compact mid-debugging (you'll lose error context)
- DON'T compact without saving modified file paths
- DON'T rely on auto-compact for complex multi-step tasks
