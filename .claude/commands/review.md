Review the recent code changes in this project:

1. Run `git diff` to see all unstaged changes, and `git diff --staged` for staged changes
2. For each modified file:
   - Check code quality and readability
   - Verify error handling is complete
   - Look for security issues
   - Ensure it follows the project conventions in CLAUDE.md
3. Check if tests exist for new functionality — if not, flag it
4. Check if documentation needs updating
5. Provide a summary:
   - ✅ Ready to commit (with suggested commit message)
   - ⚠️ Needs changes (list specific issues)
   - 🔴 Has blockers (list critical problems)
