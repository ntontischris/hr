---
name: debugging
description: Systematic debugging approach. Use when fixing bugs, investigating errors, when user mentions a bug, error, crash, or unexpected behavior.
---

# Debugging Skill

## Systematic Approach

### 1. Reproduce
- Get exact error message and stack trace
- Identify the minimal steps to reproduce
- Determine: always happens, or intermittent?

### 2. Isolate
- Find the exact line where behavior diverges from expected
- Use binary search: check the midpoint of the call chain
- Read error messages carefully — they usually tell you exactly what's wrong

### 3. Understand
- WHY is this happening, not just WHERE
- Check recent changes: `git log --oneline -20`
- Check if it's a regression: `git bisect`

### 4. Fix
- Fix the root cause, not the symptom
- If a null check fixes it, ask WHY it's null
- Minimal change — don't refactor while debugging

### 5. Verify
- Does the original bug reproduce? It shouldn't.
- Did the fix break anything else? Run related tests.
- Add a test that catches this specific bug.

## Common Patterns
- **"It works on my machine"** → Check env vars, node version, OS differences
- **Intermittent failures** → Race condition, timing, or external dependency
- **"Nothing changed"** → Check dependencies, env vars, and config files
- **Silent failures** → Missing error handling, swallowed exceptions

## Tools
```bash
# Find where something is defined
grep -rn "functionName" src/

# Check recent changes to a file
git log --oneline -10 -- path/to/file

# Find when a bug was introduced
git bisect start
git bisect bad        # current commit is bad
git bisect good v1.0  # this version was good
```
