---
name: verification-loop
description: Continuous verification pattern for ensuring code quality during implementation. Checkpoint-based testing with automated rollback on failure. Use when implementing complex features that need step-by-step verification.
---

# Verification Loop

## Purpose
Instead of implementing everything then testing at the end,
verify CONTINUOUSLY at every step. Catch issues early.

## The Loop
```
For each implementation step:
  1. SAVE checkpoint (git stash or commit)
  2. IMPLEMENT the change
  3. VERIFY:
     - Does it build? → pnpm build
     - Do tests pass? → pnpm test
     - Does lint pass? → pnpm lint
     - Does the feature work? → manual check
  4. If PASS → commit and continue
  5. If FAIL → revert to checkpoint, analyze, try differently
```

## Checkpoint Commands
```bash
# Save checkpoint before risky change
git stash push -m "checkpoint: before [description]"

# Or commit as WIP
git add -A && git commit -m "wip: checkpoint before [description]"

# Revert if verification fails
git stash pop  # or: git reset --soft HEAD~1
```

## Verification Levels

### Quick Check (after every edit)
```bash
# TypeScript: type check only (fast)
npx tsc --noEmit
```

### Standard Check (after each step)
```bash
pnpm build && pnpm test
```

### Full Check (before commit)
```bash
pnpm build && pnpm test && pnpm lint && pnpm test:e2e
```

## When to Use
- Multi-file refactoring
- Database migration + code change
- API contract changes
- Auth/payment flow changes
- Any change touching more than 5 files

## Anti-Patterns
- DON'T implement 10 steps then test once at the end
- DON'T skip verification because "it's a small change"
- DON'T continue implementing on top of a broken build
