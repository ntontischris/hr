# /refactor-clean — Dead Code Removal & Cleanup

Find and remove dead code, unused imports, and unnecessary complexity.

## Process

1. **Scan for dead code**:
   ```bash
   # Unused exports
   npx ts-prune 2>/dev/null | head -50
   
   # Unused imports (ESLint)
   npx eslint --rule '{"no-unused-vars":"warn","@typescript-eslint/no-unused-vars":"warn"}' src/ 2>&1 | head -50
   
   # Unused files
   npx unimported 2>/dev/null | head -30
   ```

2. **Categorize findings**:
   - 🔴 Dead exports (functions/components never imported)
   - 🟡 Unused imports
   - 🔵 Commented-out code blocks
   - ⚪ TODO/FIXME/HACK comments

3. **Clean in order** (safest first):
   - Remove unused imports
   - Remove commented-out code (it's in git history)
   - Remove dead exports (verify with grep first)
   - Simplify overly complex functions

4. **Verify after each cleanup**:
   ```bash
   pnpm build && pnpm test
   ```

## Rules
- NEVER refactor and add features in the same step
- Tests MUST pass before AND after refactoring
- Use git grep to verify code is truly unused before removing
- Commit cleanup separately from feature work
