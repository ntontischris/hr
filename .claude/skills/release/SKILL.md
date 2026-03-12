---
name: release
description: Release process and checklist. Use when preparing a release, deploying, or when user mentions release, deploy, or versioning.
---

# Release Skill

## Pre-Release Checklist
1. [ ] All tests passing: `pnpm test`
2. [ ] Build succeeds: `pnpm build`
3. [ ] No lint errors: `pnpm lint`
4. [ ] No security vulnerabilities: `pnpm audit`
5. [ ] CHANGELOG updated
6. [ ] Version bumped in package.json
7. [ ] All PRs merged to main
8. [ ] Documentation updated

## Versioning (SemVer)
- MAJOR (1.0.0 → 2.0.0): Breaking changes
- MINOR (1.0.0 → 1.1.0): New features, backward compatible
- PATCH (1.0.0 → 1.0.1): Bug fixes only

## Release Process
```bash
# 1. Ensure main is up to date
git checkout main && git pull

# 2. Run full test suite
pnpm test

# 3. Build and verify
pnpm build

# 4. Bump version
npm version patch|minor|major

# 5. Push with tags
git push origin main --tags

# 6. Deploy (project-specific)
pnpm deploy
```

## Rollback
If something goes wrong:
```bash
git revert HEAD
git push origin main
# Redeploy previous version
```
