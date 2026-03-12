# Security Rules (Always Active)

## Secrets
- NEVER hardcode API keys, passwords, tokens, or secrets in code
- ALWAYS use environment variables or secret managers
- If a secret is accidentally committed: rotate IMMEDIATELY, then clean git history
- Grep check: `grep -rn "sk_\|pk_\|password.*=.*['\"]" src/`

## Authentication
- ALWAYS validate auth server-side (never trust client-only checks)
- Use getUser() not getSession() for Supabase auth verification
- Every API route must check authentication FIRST, before any logic
- Rate limit login endpoints

## Data
- NEVER log sensitive data (passwords, tokens, PII, payment info)
- ALWAYS enable RLS on every Supabase table — no exceptions
- NEVER use supabaseAdmin unless explicitly bypassing RLS with documented reason
- Validate ALL user input with Zod before processing
- Use parameterized queries (Prisma/Supabase handle this)

## Stripe
- ALWAYS verify webhook signatures with constructEvent()
- NEVER trust client-side payment status — only webhooks
- NEVER expose STRIPE_SECRET_KEY to client code

## Dependencies
- Run `pnpm audit` before releases
- No wildcard versions in package.json
- Review new dependencies before adding

## When in doubt: ask, don't assume
