Run tests intelligently for the current changes:

1. Run `git diff --name-only` to find changed files
2. For each changed source file, find its corresponding test file
3. Run only the affected tests first (faster feedback):
   ```bash
   pnpm test -- --reporter=verbose <test-file-paths>
   ```
4. If all pass, optionally run the full test suite
5. If tests fail:
   - Show the failure message clearly
   - Identify the root cause
   - Suggest a fix
   - Ask if I want you to fix it

If no test files exist for changed code, flag it and offer to create them.
