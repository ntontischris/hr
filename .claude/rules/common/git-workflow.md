# Git Workflow Rules (Always Active)

## Branches
- NEVER push directly to main
- Create feature branch: `git checkout -b feat/description`
- Keep branches short-lived (max 2-3 days)

## Commits
- Conventional commits: `type(scope): description`
- Types: feat, fix, refactor, docs, test, chore, perf
- Imperative mood: "add feature" not "added feature"
- One logical change per commit

## Before Committing
1. Run tests: `pnpm test`
2. Run lint: `pnpm lint`
3. Review diff: `git diff --staged`
4. No console.log, no TODO, no commented-out code

## Pull Requests
- Descriptive title matching conventional commit format
- Include: what changed, why, how to test
- Keep PRs small (<400 lines changed)
- Request review before merge
