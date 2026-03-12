---
name: security-audit
description: Security audit checklist and vulnerability patterns. Use when reviewing security, checking for vulnerabilities, or when user mentions security, auth, or data protection.
---

# Security Audit Skill

## Quick Scan Checklist

### Authentication
- [ ] Tokens have expiration
- [ ] Password hashing uses bcrypt/argon2 (not md5/sha)
- [ ] Login has rate limiting
- [ ] Session invalidation on logout

### Authorization
- [ ] Every API endpoint checks permissions
- [ ] No horizontal privilege escalation (user A can't access user B's data)
- [ ] Admin routes have additional verification

### Input Validation
- [ ] All user input validated before processing
- [ ] SQL queries use parameterized statements (Prisma handles this)
- [ ] HTML output is escaped (React handles this by default)
- [ ] File uploads: type, size, and name validated

### Data Protection
- [ ] No secrets in code: `grep -rn "password\|secret\|api_key\|token" src/`
- [ ] Sensitive data not in logs
- [ ] HTTPS enforced
- [ ] CORS configured correctly (not `*` in production)

### Dependencies
- [ ] Run `pnpm audit` for known vulnerabilities
- [ ] No wildcard versions in package.json

## Red Flags to Grep For
```bash
grep -rn "eval(" src/
grep -rn "innerHTML" src/
grep -rn "dangerouslySetInnerHTML" src/
grep -rn "password.*=.*['\"]" src/
grep -rn "TODO.*security\|FIXME.*security\|HACK" src/
```
