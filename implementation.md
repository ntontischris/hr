# HR AI Assistant - Implementation Plan

> Αυτό το αρχείο είναι το **single source of truth** για την πρόοδο του project.
> Κάθε φορά που ολοκληρώνεται ένα βήμα, τσεκάρεται και γράφεται τι έγινε στο Progress Log.

---

## Progress Log

Κάθε session καταγράφει τι ολοκληρώθηκε, με ημερομηνία και σύντομη περιγραφή.

| Ημερομηνία | Βήματα | Περιγραφή |
|------------|--------|-----------|
| 2026-03-12 | — | PRD βελτιώθηκε, CLAUDE.md δημιουργήθηκε, implementation plan σχεδιάστηκε |
| 2026-03-12 | 1.1–1.11 | Phase 1 Foundation complete: scaffolding, deps, shadcn, migrations (7 SQL files), Supabase clients, auth routes, middleware, validators, API helpers, errors, providers, root layout, vitest config. Build/typecheck/lint pass. |
| 2026-03-20 | 2.3 | Document parser: extractText() for PDF/DOCX/TXT with size validation, type guard, whitespace normalisation. 5/5 tests passing. pdf-parse v2 class-based API used (PDFParse + getText()). |
| 2026-03-20 | 2.7 | Chat streaming module: streamChatResponse() with SSE format, ReadableStream, fullResponsePromise. 4/4 tests passing. Typecheck clean. |
| 2026-03-20 | 2.1, 2.2, 2.4–2.6, 2.8–2.15, 1.3 | Sync session: checked off all steps completed in prior sessions. Fixed build (empty upload/route.ts, ESM config, Database types regenerated from live Supabase). Applied migrations to cloud Supabase (rynnpkfsromskbqjizbk). Fixed lint (test files `any`, eslint ignores). 10 test files, 47 tests passing. Build/lint/tests all green. |
| 2026-03-20 | 3.1, 3.2, 3.4 | Phase 3 Frontend: protected layout (sidebar, header, user-menu, mobile-nav), chat interface (welcome screen, suggestions, SSE streaming hook, message list/bubbles, typing indicator, source citations, feedback buttons, session list), error boundaries (chat, global, 404). All Greek UI. Root layout updated (Inter font, Greek subset, providers). Build/lint/tests green. |
| 2026-03-20 | 3.3, 4.1–4.5 | Chat hook tests (11 tests, SSE parsing, errors, API contract). Phase 4 Admin: layout (role guard), dashboard (stats cards), document management (table + upload dialog), audit log viewer (filterable table), user management (admin-only, role change dropdown). 20 routes, 58 tests. Build/lint green. |

---

## Phase 1: Foundation

### Step 1.1 — Project Scaffolding
- [x] `pnpm create next-app@latest` με TypeScript + Tailwind + App Router
- [x] `git init` + `git checkout -b feat/foundation`
- [x] Δημιουργία `.env.local` με όλα τα env vars
- [x] Δημιουργία `vercel.json` (region: fra1, maxDuration per route)

**Files:**
- `package.json`
- `tsconfig.json` (strict: true, @/ alias)
- `.env.local`
- `vercel.json`

### Step 1.2 — Install Dependencies
- [x] Production deps: `openai`, `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `pdf-parse`, `mammoth`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`
- [x] Dev deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `supabase`
- [x] `pnpm dlx shadcn@latest init`
- [x] shadcn components: button, input, textarea, card, dialog, dropdown-menu, avatar, badge, separator, scroll-area, skeleton, tabs, table, tooltip, sheet

**Files:**
- `package.json` (updated)
- `components/ui/*.tsx`

### Step 1.3 — Database Migrations
- [x] `supabase/migrations/001_extensions.sql` — vector + pg_trgm
- [x] `supabase/migrations/002_profiles.sql` — table, RLS, triggers (handle_new_user + sync_role_to_claims)
- [x] `supabase/migrations/003_documents.sql` — table, RLS, HNSW index, trigram index
- [x] `supabase/migrations/004_chat.sql` — chat_sessions + chat_messages, RLS, indexes
- [x] `supabase/migrations/005_audit_logs.sql` — table, RLS (SELECT only for HR), indexes
- [x] `supabase/migrations/006_rate_limits.sql` — table, cleanup function
- [x] `supabase/migrations/007_search_functions.sql` — match_documents() + hybrid_search()
- [x] `pnpm dlx supabase db push` — Migrations applied to cloud project (rynnpkfsromskbqjizbk)
- [x] `lib/types/database.ts` — manually typed (will regenerate with `supabase gen types` later)

**Files:**
- `supabase/migrations/001-007_*.sql`
- `lib/types/database.ts`

### Step 1.4 — Supabase Client Setup
- [x] `lib/supabase/server.ts` — Server client με `@supabase/ssr` + `cookies()`
- [x] `lib/supabase/client.ts` — Browser client με `createBrowserClient`
- [x] `lib/supabase/admin.ts` — Service role client (για audit logs μόνο)

**Files:**
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/supabase/admin.ts`

### Step 1.5 — OAuth Providers
- [ ] Google OAuth setup στο Supabase Dashboard
- [ ] Microsoft/Azure OAuth setup στο Supabase Dashboard
- [ ] Redirect URIs configured
- [ ] Email domain restriction ενεργοποιημένο

**Files:** Κανένα (Dashboard config)

### Step 1.6 — Auth Routes
- [x] `app/(auth)/login/page.tsx` — Login page με Google + Microsoft buttons (ελληνικά)
- [x] `app/(auth)/callback/route.ts` — OAuth callback, exchange code, resolve role
- [x] `app/(auth)/logout/route.ts` — Sign out + audit log
- [x] `lib/auth/roles.ts` — `resolveUserRole()` + `RoleSchema`

**Files:**
- `app/(auth)/login/page.tsx`
- `app/(auth)/callback/route.ts`
- `app/(auth)/logout/route.ts`
- `lib/auth/roles.ts`

### Step 1.7 — Middleware
- [x] `middleware.ts` — Route protection με `getUser()`
- [x] `/chat/*` → requires auth
- [x] `/admin/*` → requires hr_manager/admin role (from JWT)
- [x] `/api/*` → requires auth

**Files:**
- `middleware.ts`

### Step 1.8 — Zod Validators
- [x] `lib/validators/chat.ts` — ChatRequestSchema, FeedbackSchema
- [x] `lib/validators/documents.ts` — UploadDocumentSchema, DocumentSearchSchema, UpdateDocumentSchema, DocumentCategorySchema
- [x] `lib/validators/common.ts` — PaginationSchema, UuidSchema

**Files:**
- `lib/validators/chat.ts`
- `lib/validators/documents.ts`
- `lib/validators/common.ts`

### Step 1.9 — API Response Helpers
- [x] `lib/api/response.ts` — `success()`, `error()` helpers
- [x] `lib/errors.ts` — AppError, AuthError, ValidationError, NotFoundError, RateLimitError, ForbiddenError

**Files:**
- `lib/api/response.ts`
- `lib/errors.ts`

### Step 1.10 — Root Layout & Providers
- [x] `app/layout.tsx` — html lang="el", providers wrap (Inter font, Greek subset)
- [x] `components/providers/supabase-provider.tsx` — Browser client context + onAuthStateChange
- [x] `components/providers/theme-provider.tsx` — Dark/light/system mode
- [x] `app/globals.css` — Tailwind v4 + shadcn theming
- [x] `app/page.tsx` — Redirect authenticated→/chat, unauthenticated→/login

**Files:**
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `components/providers/supabase-provider.tsx`
- `components/providers/theme-provider.tsx`

### Step 1.11 — Vitest Config
- [x] `vitest.config.ts` — jsdom environment, @/ alias
- [x] `vitest.setup.ts` — @testing-library/jest-dom
- [x] package.json scripts: dev, build, test, lint, typecheck

**Files:**
- `vitest.config.ts`
- `vitest.setup.ts`
- `package.json` (scripts updated)

---

## Phase 2: RAG Pipeline

### Step 2.1 — OpenAI Client
- [x] `lib/ai/client.ts` — Single OpenAI instance

**Files:**
- `lib/ai/client.ts`

### Step 2.2 — Embeddings Module
- [x] `lib/ai/embeddings.ts` — `generateEmbedding()` (single) + `generateEmbeddings()` (batch, groups of 100)

**Files:**
- `lib/ai/embeddings.ts`

### Step 2.3 — Document Parser
- [x] `lib/documents/parser.ts` — `extractText()` για PDF, DOCX, TXT
- [x] File size validation (max 10MB)
- [x] Whitespace normalization
- [x] `lib/documents/parser.test.ts` — 5 unit tests (all passing)

**Files:**
- `lib/documents/parser.ts`
- `lib/documents/parser.test.ts`

### Step 2.4 — Text Chunker + Tests
- [x] `lib/documents/chunker.ts` — Paragraph-aware chunking, overlap, min 100 chars
- [x] `lib/documents/chunker.test.ts` — Unit tests

**Files:**
- `lib/documents/chunker.ts`
- `lib/documents/chunker.test.ts`

### Step 2.5 — Document Processing Pipeline
- [x] `lib/documents/processor.ts` — Orchestrates: extract → chunk → embed → return

**Files:**
- `lib/documents/processor.ts`

### Step 2.6 — System Prompts
- [x] `lib/ai/prompts.ts` — Greek prompts, role-specific instructions

**Files:**
- `lib/ai/prompts.ts`

### Step 2.7 — Chat Streaming Module
- [x] `lib/ai/chat.ts` — `streamChatResponse()` με SSE format
- [x] ReadableStream construction
- [x] fullResponsePromise for DB writes (replaces onComplete callback)

**Files:**
- `lib/ai/chat.ts`
- `lib/ai/chat.test.ts`

### Step 2.8 — Chat API Route
- [x] `app/api/chat/route.ts` — POST handler
- [x] Auth check (getUser)
- [x] Zod validation
- [x] Rate limit check
- [x] Embedding generation → hybrid search
- [x] Multi-turn context (last 10 messages)
- [x] Streaming response
- [x] Save messages + audit log via onComplete

**Files:**
- `app/api/chat/route.ts`

### Step 2.9 — Document Upload API
- [x] `app/api/documents/upload/route.ts` — POST handler
- [x] Auth + HR role check
- [x] File validation (type, size)
- [x] Process pipeline → bulk insert chunks
- [x] Audit log

**Files:**
- `app/api/documents/upload/route.ts`

### Step 2.10 — Document CRUD APIs
- [x] `app/api/documents/route.ts` — GET list (paginated, filtered)
- [x] `app/api/documents/[id]/route.ts` — GET, PATCH, DELETE (soft)
- [x] `app/api/documents/search/route.ts` — POST semantic search

**Files:**
- `app/api/documents/route.ts`
- `app/api/documents/[id]/route.ts`
- `app/api/documents/search/route.ts`

### Step 2.11 — Session APIs
- [x] `app/api/sessions/route.ts` — GET list, POST create
- [x] `app/api/sessions/[id]/route.ts` — GET with messages, DELETE (archive)

**Files:**
- `app/api/sessions/route.ts`
- `app/api/sessions/[id]/route.ts`

### Step 2.12 — Feedback API
- [x] `app/api/feedback/route.ts` — POST (update message feedback)

**Files:**
- `app/api/feedback/route.ts`

### Step 2.13 — Audit Logs API
- [x] `app/api/logs/route.ts` — GET (HR only, filtered, paginated)

**Files:**
- `app/api/logs/route.ts`

### Step 2.14 — Users API
- [x] `app/api/users/route.ts` — GET list (HR), PATCH role (admin only)

**Files:**
- `app/api/users/route.ts`

### Step 2.15 — Rate Limiting
- [x] `lib/rate-limit.ts` — `checkRateLimit()` database-backed
- [x] `lib/rate-limit.test.ts` — Unit tests

**Files:**
- `lib/rate-limit.ts`
- `lib/rate-limit.test.ts`

---

## Phase 3: Frontend

### Step 3.1 — Protected Layout
- [x] `app/(protected)/layout.tsx` — Server Component, fetch user + profile
- [x] `app/(protected)/loading.tsx` — Full page skeleton
- [x] `components/layout/sidebar.tsx` — Navigation, session list, HR section
- [x] `components/layout/header.tsx` — Title, breadcrumb, user avatar
- [x] `components/layout/user-menu.tsx` — Dropdown (name, email, role, sign out, theme)
- [x] `components/layout/mobile-nav.tsx` — Sheet/drawer for mobile

**Files:**
- `app/(protected)/layout.tsx`
- `app/(protected)/loading.tsx`
- `components/layout/sidebar.tsx`
- `components/layout/header.tsx`
- `components/layout/user-menu.tsx`
- `components/layout/mobile-nav.tsx`

### Step 3.2 — Chat Interface
- [x] `app/(protected)/chat/page.tsx` — Server Component, welcome state
- [x] `app/(protected)/chat/loading.tsx` — Chat skeleton
- [x] `app/(protected)/chat/[sessionId]/page.tsx` — Load session + messages
- [x] `components/chat/chat-interface.tsx` — Client, main orchestrator
- [x] `hooks/use-chat.ts` — sendMessage, SSE parsing, session management
- [x] `components/chat/message-list.tsx` — ScrollArea with auto-scroll
- [x] `components/chat/message-bubble.tsx` — User/assistant styling, markdown, timestamp
- [x] `components/chat/chat-input.tsx` — Textarea, auto-resize, Enter to send
- [x] `components/chat/source-citation.tsx` — Collapsible sources section
- [x] `components/chat/typing-indicator.tsx` — "Σκέφτομαι..." animation
- [x] `components/chat/session-list.tsx` — Sessions sidebar with active highlight
- [x] `components/chat/feedback-buttons.tsx` — Thumbs up/down per message

**Files:**
- `app/(protected)/chat/page.tsx`
- `app/(protected)/chat/loading.tsx`
- `app/(protected)/chat/[sessionId]/page.tsx`
- `components/chat/chat-interface.tsx`
- `hooks/use-chat.ts`
- `components/chat/message-list.tsx`
- `components/chat/message-bubble.tsx`
- `components/chat/chat-input.tsx`
- `components/chat/source-citation.tsx`
- `components/chat/typing-indicator.tsx`
- `components/chat/session-list.tsx`
- `components/chat/feedback-buttons.tsx`

### Step 3.3 — Chat Hook Tests
- [x] `hooks/use-chat.test.ts` — SSE parsing, session/sources extraction, error handling (11 tests)

**Files:**
- `hooks/use-chat.test.ts`

### Step 3.4 — Error States
- [x] `app/(protected)/chat/error.tsx` — Chat error boundary (ελληνικά)
- [x] `app/error.tsx` — Global error boundary
- [x] `app/not-found.tsx` — Custom 404 (ελληνικά)

**Files:**
- `app/(protected)/chat/error.tsx`
- `app/error.tsx`
- `app/not-found.tsx`

---

## Phase 4: Admin Dashboard

### Step 4.1 — Admin Layout
- [x] `app/(protected)/admin/layout.tsx` — Role verification, admin tabs
- [x] `app/(protected)/admin/page.tsx` — Dashboard, fetch stats server-side

**Files:**
- `app/(protected)/admin/layout.tsx`
- `app/(protected)/admin/page.tsx`

### Step 4.2 — Stats Cards
- [x] `components/admin/stats-cards.tsx` — Συνομιλίες, Ενεργοί Χρήστες, Εγγραφα, Βαθμολογία

**Files:**
- `components/admin/stats-cards.tsx`

### Step 4.3 — Document Management
- [x] `app/(protected)/admin/documents/page.tsx` — Document list page
- [x] `components/admin/document-list.tsx` — Table με actions
- [x] `components/admin/document-uploader.tsx` — Upload dialog με progress
- [ ] `hooks/use-documents.ts` — CRUD operations hook (deferred: inline state used instead)

**Files:**
- `app/(protected)/admin/documents/page.tsx`
- `components/admin/document-list.tsx`
- `components/admin/document-uploader.tsx`
- `hooks/use-documents.ts`

### Step 4.4 — Audit Log Viewer
- [x] `app/(protected)/admin/logs/page.tsx` — Logs page
- [x] `components/admin/audit-log-table.tsx` — Filterable table (date, action, user)
- [ ] `hooks/use-audit-logs.ts` — Fetch with filters (deferred: inline state used instead)

**Files:**
- `app/(protected)/admin/logs/page.tsx`
- `components/admin/audit-log-table.tsx`
- `hooks/use-audit-logs.ts`

### Step 4.5 — User Management
- [x] `app/(protected)/admin/users/page.tsx` — Users page (admin only)
- [x] `components/admin/user-table.tsx` — Table, role change dropdown, confirmation

**Files:**
- `app/(protected)/admin/users/page.tsx`
- `components/admin/user-table.tsx`

---

## Phase 5: Polish & Launch

### Step 5.1 — Security Audit
- [ ] Όλα τα API routes ξεκινάνε με `getUser()`
- [ ] Κανένα `getSession()` πουθενά
- [ ] Zod validation σε κάθε API input
- [ ] Supabase `{ error }` checked παντού
- [ ] Audit logs μόνο μέσω service role
- [ ] Sensitive categories (evaluation, disciplinary, payroll) μόνο HR
- [ ] `HR_MANAGER_EMAILS` από env, όχι hardcoded
- [ ] Grep check: `grep -rn "sk_\|pk_\|password.*=.*['\"]" src/`
- [ ] Rate limiting ενεργό σε chat + upload
- [ ] File upload validation (type, size)
- [ ] RLS ενεργοποιημένο σε κάθε table

### Step 5.2 — Performance
- [ ] Streaming latency < 2s (first byte)
- [ ] Hybrid search < 500ms
- [ ] `loading.tsx` σε κάθε route segment
- [ ] Server Components by default
- [ ] Suspense boundaries στο admin dashboard
- [ ] HNSW index verified (EXPLAIN ANALYZE)

### Step 5.3 — Responsive Design
- [ ] Mobile chat: full-width, collapsible sidebar
- [ ] Mobile admin: card view on small screens
- [ ] Touch targets min 44px
- [ ] Tested: iOS Safari, Chrome Android

### Step 5.4 — i18n Greek Strings
- [ ] `lib/i18n/el.ts` — Όλα τα UI labels, errors, placeholders
- [ ] Organized by feature: auth, chat, admin, common

**Files:**
- `lib/i18n/el.ts`

### Step 5.5 — Test Suite
- [ ] `lib/documents/chunker.test.ts` — Text chunking
- [ ] `lib/ai/embeddings.test.ts` — Mocked OpenAI
- [ ] `lib/ai/chat.test.ts` — Stream, SSE format
- [ ] `lib/auth/roles.test.ts` — Role resolution
- [ ] `lib/rate-limit.test.ts` — Rate limiting
- [ ] `lib/validators/chat.test.ts` — Zod schemas
- [ ] `lib/validators/documents.test.ts` — Zod schemas
- [ ] `hooks/use-chat.test.ts` — Hook with mocked SSE
- [ ] `lib/test-utils/factories.ts` — Mock data factories
- [ ] Coverage ≥ 80% στο `lib/`
- [ ] Coverage 100% στο auth/roles

### Step 5.6 — Deployment
- [ ] Push to GitHub
- [ ] Vercel project (EU, fra1)
- [ ] Environment variables configured
- [ ] Custom domain + SSL
- [ ] OAuth redirect URIs updated
- [ ] `pnpm build` — no errors
- [ ] Deploy to staging
- [ ] Load initial HR documents
- [ ] Pilot: 5-10 test users
- [ ] Go live

---

## API Endpoints Reference

| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/api/chat` | POST | Yes | All | Chat with streaming SSE |
| `/api/documents` | GET | Yes | All (filtered) | List documents |
| `/api/documents/upload` | POST | Yes | HR/Admin | Upload + embed |
| `/api/documents/[id]` | GET | Yes | All (filtered) | Get document |
| `/api/documents/[id]` | PATCH | Yes | HR/Admin | Update metadata |
| `/api/documents/[id]` | DELETE | Yes | HR/Admin | Soft delete |
| `/api/documents/search` | POST | Yes | All (filtered) | Semantic search |
| `/api/sessions` | GET | Yes | Own | List sessions |
| `/api/sessions` | POST | Yes | All | Create session |
| `/api/sessions/[id]` | GET | Yes | Own/HR | Get + messages |
| `/api/sessions/[id]` | DELETE | Yes | Own | Archive |
| `/api/feedback` | POST | Yes | Own msg | Thumbs up/down |
| `/api/logs` | GET | Yes | HR/Admin | Audit logs |
| `/api/users` | GET | Yes | HR/Admin | List users |
| `/api/users` | PATCH | Yes | Admin | Change role |

---

## Components Reference

| Component | Type | Location |
|-----------|------|----------|
| chat-interface | Client | `components/chat/` |
| message-list | Client | `components/chat/` |
| message-bubble | Client | `components/chat/` |
| chat-input | Client | `components/chat/` |
| source-citation | Client | `components/chat/` |
| typing-indicator | Client | `components/chat/` |
| session-list | Client | `components/chat/` |
| feedback-buttons | Client | `components/chat/` |
| document-uploader | Client | `components/admin/` |
| document-list | Client | `components/admin/` |
| audit-log-table | Client | `components/admin/` |
| stats-cards | Server | `components/admin/` |
| user-table | Client | `components/admin/` |
| sidebar | Client | `components/layout/` |
| header | Server | `components/layout/` |
| user-menu | Client | `components/layout/` |
| mobile-nav | Client | `components/layout/` |
| supabase-provider | Client | `components/providers/` |
| theme-provider | Client | `components/providers/` |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| GPT-5 mini ελληνικά χαμηλής ποιότητας | Test νωρίς, fallback σε GPT-5 (αλλαγή model string μόνο) |
| PDF extraction κακής ποιότητας | Preview extracted text πριν save, OCR αργότερα αν χρειαστεί |
| pgvector format mismatch | End-to-end test embedding insert/query στο Step 2.2 |
| JWT role not synced μετά αλλαγή | sync_role_to_claims trigger, re-login needed, note στο admin UI |
| SSE streaming broken by proxy | Vercel handles natively, Cache-Control: no-cache, test early |
| Rate limiting bypass (πολλά tabs) | Database-backed, δουλεύει cross-instance |
| Large document upload timeout | 120s max for upload route, batch embeddings, progress UI |
