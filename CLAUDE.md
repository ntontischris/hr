# HR AI Assistant

## Project Overview
Internal HR AI chatbot for a Greek company. Employees ask HR questions, get answers from approved documents (RAG). HR managers manage documents, view audit logs, and access restricted content.

## Tech Stack
- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + pgvector + HNSW index)
- **AI**: OpenAI GPT-5 mini (chat) + text-embedding-3-small (embeddings) — single provider
- **Auth**: Supabase Auth via `@supabase/ssr` (Google + Microsoft OAuth)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Validation**: Zod at all API boundaries
- **Package Manager**: pnpm
- **Deployment**: Vercel (EU region, `fra1`)
- **Testing**: Vitest + Testing Library

## Key Architecture Decisions
- **Single AI provider (OpenAI)** for both chat and embeddings — cost and simplicity
- **Streaming responses (SSE)** for chat — critical UX requirement
- **Multi-turn conversations** — last 10 messages sent to LLM
- **Hybrid search** — vector similarity + trigram text fallback
- **JWT-based role checks in RLS** — avoids recursive profile policy lookups
- **Audit logs via service role only** — no public insert policy
- **Batch embeddings** on document upload
- **Soft delete + versioning** for documents

## Roles
- `employee` — sees public docs, can chat
- `hr_manager` — sees all docs (incl. payroll, disciplinary), manages documents, views audit logs
- `admin` — everything + user role management

## Important Rules
- ALWAYS use `getUser()` never `getSession()` for auth verification
- ALWAYS validate inputs with Zod before processing
- ALWAYS check `{ error }` on Supabase calls — it doesn't throw
- ALWAYS use service role client for audit log inserts
- NEVER expose sensitive categories (evaluation, disciplinary, payroll) to employees
- NEVER hardcode HR manager emails — use `HR_MANAGER_EMAILS` env var
- Greek is the primary UI language — all user-facing text in Greek
- Date format: DD/MM/YYYY (`el-GR` locale)

## File Naming
- Components: kebab-case (`chat-interface.tsx`, `message-bubble.tsx`)
- Hooks: kebab-case with `use-` prefix (`use-chat.ts`, `use-session.ts`)
- Libs: kebab-case (`embeddings.ts`, `chunker.ts`)
- Use `@/` path alias for all imports

## Key Files
- `prd.md` — Full PRD with database schema, API specs, and implementation plan
- `middleware.ts` — Route protection (auth + role checks)
- `lib/ai/chat.ts` — Chat completion with streaming
- `lib/ai/embeddings.ts` — Embedding generation (single + batch)
- `lib/ai/prompts.ts` — System prompts (Greek)
- `lib/supabase/server.ts` — Server-side Supabase client
- `lib/supabase/admin.ts` — Service role client (for audit logs)
- `lib/validators/` — Zod schemas for all API inputs

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
NEXT_PUBLIC_APP_URL
ALLOWED_EMAIL_DOMAIN
HR_MANAGER_EMAILS
RATE_LIMIT_CHAT_PER_MINUTE
RATE_LIMIT_UPLOAD_PER_HOUR
```

## Commands
```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test         # Run tests (vitest)
pnpm lint         # Lint (next lint)
pnpm typecheck    # TypeScript check (tsc --noEmit)
```

## Implementation Workflow — MANDATORY

### Before Starting Work
1. **ALWAYS read `implementation.md`** first to see current progress
2. Check the Progress Log to understand what was done in previous sessions
3. Find the next unchecked `- [ ]` step — that's where you start
4. Do NOT skip steps. Follow the order strictly unless explicitly told otherwise

### While Working
1. Work on ONE step at a time
2. After completing each sub-task, check it off: change `- [ ]` to `- [x]`
3. Run tests after every significant change: `pnpm test`
4. Run typecheck: `pnpm typecheck`

### After Completing a Step
1. Mark ALL sub-tasks as `- [x]` in `implementation.md`
2. **Add a row to the Progress Log table** with:
   - Date (YYYY-MM-DD)
   - Step numbers completed (e.g., "1.1, 1.2")
   - Brief description of what was done
3. If a step is partially done, note it in the Progress Log (e.g., "Step 1.3 — 5/7 migrations done")

### At End of Session
1. Update Progress Log with final status
2. If anything is blocked or needs attention, add a note under the relevant step

### Reference Docs (read in this order)
1. `CLAUDE.md` (this file) — project rules and conventions
2. `implementation.md` — full plan with progress tracking
3. `prd.md` — detailed specs, SQL schemas, API contracts, code samples
