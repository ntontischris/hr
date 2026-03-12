---
name: code-review
description: Code review patterns and checklists. Use when reviewing PRs, checking code quality, or when the user asks to review code.
---

# Code Review Skill

## Review Process
1. Read the changed files and understand the intent
2. Check against the project's CLAUDE.md conventions
3. Apply the checklist below
4. Provide actionable, specific feedback

## Checklist

### Correctness
- Does the logic match the intended behavior?
- Are all edge cases handled (null, empty, boundary values)?
- Are error paths handled gracefully?

### Readability
- Are names descriptive and consistent?
- Is the code self-documenting?
- Are complex sections commented?

### Performance
- Any N+1 queries?
- Unnecessary loops or re-computations?
- Large objects cloned unnecessarily?

### Security
- User input validated?
- No secrets in code?
- Auth checks present on protected routes?

### Testing
- New code has tests?
- Tests cover happy path AND error cases?
- Tests are readable and maintainable?

## Output Format
Use severity levels: 🔴 Must Fix | 🟡 Should Fix | 🔵 Suggestion
Always reference specific file:line numbers.
