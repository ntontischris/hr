Create a well-formatted conventional commit for the current changes:

1. Run `git status` to see what's changed
2. Run `git diff --staged` — if nothing staged, ask me if I want to stage all changes
3. Analyze the changes and determine the commit type:
   - feat: New feature
   - fix: Bug fix
   - refactor: Code refactoring
   - docs: Documentation changes
   - test: Adding/updating tests
   - chore: Maintenance tasks
   - perf: Performance improvements
4. Determine the scope from the primary directory/module affected
5. Write a clear commit message:
   ```
   type(scope): concise description (imperative mood)
   
   - Specific change 1
   - Specific change 2
   ```
6. Show me the proposed message and wait for approval before committing
7. After commit, show the commit hash
