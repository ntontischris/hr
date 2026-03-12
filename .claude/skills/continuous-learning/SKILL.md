---
name: continuous-learning
description: Automatically extract reusable patterns and knowledge from coding sessions. Saves debugging techniques, workarounds, and project-specific patterns as new skills. Use when discovering non-trivial patterns that should be remembered.
---

# Continuous Learning System

## Purpose
When Claude discovers something non-trivial during a session — a debugging technique, 
a workaround, a project-specific pattern — it saves that knowledge as a learned skill.
Next time a similar problem comes up, the skill loads automatically.

## How It Works

### During a Session
When you solve a non-trivial problem, use `/learn` to extract the pattern:

```
/learn "Supabase RLS prevents webhook handler from updating — need supabaseAdmin"
```

This creates a file in `~/.claude/skills/learned/` that persists across sessions.

### Learned Skill Format
```markdown
# [Pattern Name]
## Discovered: [date]
## Context: [project/task]

### Problem
[What went wrong or what was unexpected]

### Solution
[The fix or workaround]

### Key Insight
[Why this works — the underlying principle]

### Applies When
[Conditions that trigger this pattern]
```

### Auto-Detection Triggers
The system should save a pattern when:
- A bug took more than 2 attempts to fix
- A workaround was needed for a library/framework limitation
- A project-specific convention was discovered by reading existing code
- An error message required non-obvious debugging steps
- A performance optimization produced significant improvement

### Storage
```
~/.claude/skills/learned/
├── supabase-rls-webhook-workaround.md
├── nextjs-middleware-cookie-handling.md
├── stripe-webhook-raw-body-gotcha.md
└── python-asyncio-httpx-timeout-pattern.md
```

### Quality Rules
- Only save NON-TRIVIAL knowledge (not basic syntax)
- Each skill must be self-contained and actionable
- Include the PROBLEM, SOLUTION, and KEY INSIGHT
- Use descriptive filenames (kebab-case)
- Keep each skill under 50 lines
