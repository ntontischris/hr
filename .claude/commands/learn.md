# /learn — Extract Pattern from Current Session

Extract a reusable pattern or lesson learned from the current session.

## Usage
```
/project:learn "description of what was learned"
```

## Process
1. Review the current session context
2. Identify the non-trivial pattern, workaround, or insight
3. Create a learned skill file in `~/.claude/skills/learned/`

## Output Format
Create a file: `~/.claude/skills/learned/[kebab-case-name].md`

```markdown
# [Pattern Name]
## Discovered: [today's date]
## Project: [current project name]

### Problem
[What went wrong or was unexpected]

### Solution  
[The fix, workaround, or technique]

### Key Insight
[The underlying principle — WHY this works]

### Applies When
[Conditions where this pattern is relevant]

### Example
[Brief code example if applicable]
```

## Quality Check
Before saving, verify:
- Is this NON-TRIVIAL? (basic syntax doesn't count)
- Is it ACTIONABLE? (can someone use this directly?)
- Is it SELF-CONTAINED? (doesn't require external context?)

If yes to all three → save. Otherwise → don't save.
