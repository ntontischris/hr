# /build-fix — Fix Build Errors

Systematically diagnose and fix build/compilation errors.

## Process
1. Run the build command:
   ```bash
   pnpm build 2>&1 | head -100
   ```

2. Parse the error output:
   - Count total errors
   - Group by type (TypeScript, ESLint, import, runtime)
   - Identify the FIRST error (often cascading errors follow)

3. Fix the FIRST error only:
   - Read the file at the error line
   - Understand the root cause
   - Apply minimal fix
   - Explain what was wrong

4. Re-run build to check:
   ```bash
   pnpm build 2>&1 | head -50
   ```

5. Repeat until build passes

## Delegate to @build-error-resolver for complex multi-file errors.

## Common Quick Fixes
- "Module not found" → Check imports, install missing package
- "Type error" → Fix type mismatch, add null check
- "ESLint error" → Fix the violation (don't disable rules)
- "Cannot find name" → Add missing import
