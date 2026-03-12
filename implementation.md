# HR AI Assistant - Implementation Plan

> Αυτό το αρχείο είναι το **single source of truth** για την πρόοδο του project.
> Κάθε φορά που ολοκληρώνεται ένα βήμα, τσεκάρεται και γράφεται τι έγινε στο Progress Log.

---

## Progress Log

Κάθε session καταγράφει τι ολοκληρώθηκε, με ημερομηνία και σύντομη περιγραφή.

| Ημερομηνία | Βήματα | Περιγραφή |
|------------|--------|-----------|
| 2026-03-12 | — | PRD βελτιώθηκε, CLAUDE.md δημιουργήθηκε, implementation plan σχεδιάστηκε |

---

## Phase 1: Foundation

### Step 1.1 — Project Scaffolding
- [ ] `pnpm create next-app@latest` με TypeScript + Tailwind + App Router
- [ ] `git init` + `git checkout -b feat/foundation`
- [ ] Δημιουργία `.env.local` με όλα τα env vars
- [ ] Δημιουργία `vercel.json` (region: fra1, maxDuration per route)

**Files:**
- `package.json`
- `tsconfig.json` (strict: true, @/ alias)
- `.env.local`
- `vercel.json`

### Step 1.2 — Install Dependencies
- [ ] Production deps: `openai`, `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `pdf-parse`, `mammoth`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`
- [ ] Dev deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `supabase`
- [ ] `pnpm dlx shadcn@latest init`
- [ ] shadcn components: button, input, textarea, card, dialog, dropdown-menu, avatar, badge, separator, scroll-area, skeleton, tabs, table, tooltip, sheet

**Files:**
- `package.json` (updated)
- `components/ui/*.tsx`

### Step 1.3 — Database Migrations
- [ ] `supabase/migrations/001_extensions.sql` — vector + pg_trgm
- [ ] `supabase/migrations/002_profiles.sql` — table, RLS, triggers (handle_new_user + sync_role_to_claims)
- [ ] `supabase/migrations/003_documents.sql` — table, RLS, HNSW index, trigram index
- [ ] `supabase/migrations/004_chat.sql` — chat_sessions + chat_messages, RLS, indexes
- [ ] `supabase/migrations/005_audit_logs.sql` — table, RLS (SELECT only for HR), indexes
- [ ] `supabase/migrations/006_rate_limits.sql` — table, cleanup function
- [ ] `supabase/migrations/007_search_functions.sql` — match_documents() + hybrid_search()
- [ ] `pnpm dlx supabase db push` — εφαρμογή migrations
- [ ] `pnpm dlx supabase gen types typescript` → `lib/types/database.ts`

**Files:**
- `supabase/migrations/001-007_*.sql`
- `lib/types/database.ts`

### Step 1.4 — Supabase Client Setup
- [ ] `lib/supabase/server.ts` — Server client με `@supabase/ssr` + `cookies()`
- [ ] `lib/supabase/client.ts` — Browser client με `createBrowserClient`
- [ ] `lib/supabase/admin.ts` — Service role client (για audit logs μόνο)

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
- [ ] `app/(auth)/login/page.tsx` — Login page με Google + Microsoft buttons (ελληνικά)
- [ ] `app/(auth)/callback/route.ts` — OAuth callback, exchange code, resolve role
- [ ] `app/(auth)/logout/route.ts` — Sign out + audit log
- [ ] `lib/auth/roles.ts` — `resolveUserRole()` + `RoleSchema`

**Files:**
- `app/(auth)/login/page.tsx`
- `app/(auth)/callback/route.ts`
- `app/(auth)/logout/route.ts`
- `lib/auth/roles.ts`

### Step 1.7 — Middleware
- [ ] `middleware.ts` — Route protection με `getUser()`
- [ ] `/chat/*` → requires auth
- [ ] `/admin/*` → requires hr_manager/admin role (from JWT)
- [ ] `/api/*` → requires auth

**Files:**
- `middleware.ts`

### Step 1.8 — Zod Validators
- [ ] `lib/validators/chat.ts` — ChatRequestSchema, FeedbackSchema
- [ ] `lib/validators/documents.ts` — UploadDocumentSchema, DocumentSearchSchema, UpdateDocumentSchema, DocumentCategorySchema
- [ ] `lib/validators/common.ts` — PaginationSchema, UuidSchema

**Files:**
- `lib/validators/chat.ts`
- `lib/validators/documents.ts`
- `lib/validators/common.ts`

### Step 1.9 — API Response Helpers
- [ ] `lib/api/response.ts` — `success()`, `error()` helpers
- [ ] `lib/errors.ts` — AppError, AuthError, ValidationError, NotFoundError, RateLimitError

**Files:**
- `lib/api/response.ts`
- `lib/errors.ts`

### Step 1.10 — Root Layout & Providers
- [ ] `app/layout.tsx` — html lang="el", providers wrap
- [ ] `components/providers/supabase-provider.tsx` — Browser client context + onAuthStateChange
- [ ] `components/providers/theme-provider.tsx` — Dark/light mode
- [ ] `app/globals.css` — Tailwind v4 + shadcn theming
- [ ] `app/page.tsx` — Redirect authenticated→/chat, unauthenticated→/login

**Files:**
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `components/providers/supabase-provider.tsx`
- `components/providers/theme-provider.tsx`

### Step 1.11 — Vitest Config
- [ ] `vitest.config.ts` — jsdom environment, @/ alias
- [ ] `vitest.setup.ts` — @testing-library/jest-dom
- [ ] package.json scripts: dev, build, test, lint, typecheck

**Files:**
- `vitest.config.ts`
- `vitest.setup.ts`
- `package.json` (scripts updated)

---

## Phase 2: RAG Pipeline

### Step 2.1 — OpenAI Client
- [ ] `lib/ai/client.ts` — Single OpenAI instance

**Files:**
- `lib/ai/client.ts`

### Step 2.2 — Embeddings Module
- [ ] `lib/ai/embeddings.ts` — `generateEmbedding()` (single) + `generateEmbeddings()` (batch, groups of 100)

**Files:**
- `lib/ai/embeddings.ts`

### Step 2.3 — Document Parser
- [ ] `lib/documents/parser.ts` — `extractText()` για PDF, DOCX, TXT
- [ ] File size validation (max 10MB)
- [ ] Whitespace normalization

**Files:**
- `lib/documents/parser.ts`

### Step 2.4 — Text Chunker + Tests
- [ ] `lib/documents/chunker.ts` — Paragraph-aware chunking, overlap, min 100 chars
- [ ] `lib/documents/chunker.test.ts` — Unit tests

**Files:**
- `lib/documents/chunker.ts`
- `lib/documents/chunker.test.ts`

### Step 2.5 — Document Processing Pipeline
- [ ] `lib/documents/processor.ts` — Orchestrates: extract → chunk → embed → return

**Files:**
- `lib/documents/processor.ts`

### Step 2.6 — System Prompts
- [ ] `lib/ai/prompts.ts` — Greek prompts, role-specific instructions

**Files:**
- `lib/ai/prompts.ts`

### Step 2.7 — Chat Streaming Module
- [ ] `lib/ai/chat.ts` — `streamChatResponse()` με SSE format
- [ ] ReadableStream construction
- [ ] onComplete callback for DB writes

**Files:**
- `lib/ai/chat.ts`

### Step 2.8 — Chat API Route
- [ ] `app/api/chat/route.ts` — POST handler
- [ ] Auth check (getUser)
- [ ] Zod validation
- [ ] Rate limit check
- [ ] Embedding generation → hybrid search
- [ ] Multi-turn context (last 10 messages)
- [ ] Streaming response
- [ ] Save messages + audit log via onComplete

**Files:**
- `app/api/chat/route.ts`

### Step 2.9 — Document Upload API
- [ ] `app/api/documents/upload/route.ts` — POST handler
- [ ] Auth + HR role check
- [ ] File validation (type, size)
- [ ] Process pipeline → bulk insert chunks
- [ ] Audit log

**Files:**
- `app/api/documents/upload/route.ts`

### Step 2.10 — Document CRUD APIs
- [ ] `app/api/documents/route.ts` — GET list (paginated, filtered)
- [ ] `app/api/documents/[id]/route.ts` — GET, PATCH, DELETE (soft)
- [ ] `app/api/documents/search/route.ts` — POST semantic search

**Files:**
- `app/api/documents/route.ts`
- `app/api/documents/[id]/route.ts`
- `app/api/documents/search/route.ts`

### Step 2.11 — Session APIs
- [ ] `app/api/sessions/route.ts` — GET list, POST create
- [ ] `app/api/sessions/[id]/route.ts` — GET with messages, DELETE (archive)

**Files:**
- `app/api/sessions/route.ts`
- `app/api/sessions/[id]/route.ts`

### Step 2.12 — Feedback API
- [ ] `app/api/feedback/route.ts` — POST (update message feedback)

**Files:**
- `app/api/feedback/route.ts`

### Step 2.13 — Audit Logs API
- [ ] `app/api/logs/route.ts` — GET (HR only, filtered, paginated)

**Files:**
- `app/api/logs/route.ts`

### Step 2.14 — Users API
- [ ] `app/api/users/route.ts` — GET list (HR), PATCH role (admin only)

**Files:**
- `app/api/users/route.ts`

### Step 2.15 — Rate Limiting
- [ ] `lib/rate-limit.ts` — `checkRateLimit()` database-backed
- [ ] `lib/rate-limit.test.ts` — Unit tests

**Files:**
- `lib/rate-limit.ts`
- `lib/rate-limit.test.ts`

---

## Phase 3: Frontend

### Step 3.1 — Protected Layout
- [ ] `app/(protected)/layout.tsx` — Server Component, fetch user + profile
- [ ] `app/(protected)/loading.tsx` — Full page skeleton
- [ ] `components/layout/sidebar.tsx` — Navigation, session list, HR section
- [ ] `components/layout/header.tsx` — Title, breadcrumb, user avatar
- [ ] `components/layout/user-menu.tsx` — Dropdown (name, email, role, sign out, theme)
- [ ] `components/layout/mobile-nav.tsx` — Sheet/drawer for mobile

**Files:**
- `app/(protected)/layout.tsx`
- `app/(protected)/loading.tsx`
- `components/layout/sidebar.tsx`
- `components/layout/header.tsx`
- `components/layout/user-menu.tsx`
- `components/layout/mobile-nav.tsx`

### Step 3.2 — Chat Interface
- [ ] `app/(protected)/chat/page.tsx` — Server Component, welcome state
- [ ] `app/(protected)/chat/loading.tsx` — Chat skeleton
- [ ] `app/(protected)/chat/[sessionId]/page.tsx` — Load session + messages
- [ ] `components/chat/chat-interface.tsx` — Client, main orchestrator
- [ ] `hooks/use-chat.ts` — sendMessage, SSE parsing, session management
- [ ] `components/chat/message-list.tsx` — ScrollArea with auto-scroll
- [ ] `components/chat/message-bubble.tsx` — User/assistant styling, markdown, timestamp
- [ ] `components/chat/chat-input.tsx` — Textarea, auto-resize, Enter to send
- [ ] `components/chat/source-citation.tsx` — Collapsible sources section
- [ ] `components/chat/typing-indicator.tsx` — "Σκέφτομαι..." animation
- [ ] `components/chat/session-list.tsx` — Sessions sidebar with active highlight
- [ ] `components/chat/feedback-buttons.tsx` — Thumbs up/down per message

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
- [ ] `hooks/use-chat.test.ts` — Mock SSE, test optimistic updates, error handling

**Files:**
- `hooks/use-chat.test.ts`

### Step 3.4 — Error States
- [ ] `app/(protected)/chat/error.tsx` — Chat error boundary (ελληνικά)
- [ ] `app/error.tsx` — Global error boundary
- [ ] `app/not-found.tsx` — Custom 404 (ελληνικά)

**Files:**
- `app/(protected)/chat/error.tsx`
- `app/error.tsx`
- `app/not-found.tsx`

---

## Phase 4: Admin Dashboard

### Step 4.1 — Admin Layout
- [ ] `app/(protected)/admin/layout.tsx` — Role verification, admin tabs
- [ ] `app/(protected)/admin/page.tsx` — Dashboard, fetch stats server-side

**Files:**
- `app/(protected)/admin/layout.tsx`
- `app/(protected)/admin/page.tsx`

### Step 4.2 — Stats Cards
- [ ] `components/admin/stats-cards.tsx` — Συνομιλίες, Ενεργοί Χρήστες, Εγγραφα, Βαθμολογία

**Files:**
- `components/admin/stats-cards.tsx`

### Step 4.3 — Document Management
- [ ] `app/(protected)/admin/documents/page.tsx` — Document list page
- [ ] `components/admin/document-list.tsx` — Table με actions
- [ ] `components/admin/document-uploader.tsx` — Upload dialog, drag & drop, progress
- [ ] `hooks/use-documents.ts` — CRUD operations hook

**Files:**
- `app/(protected)/admin/documents/page.tsx`
- `components/admin/document-list.tsx`
- `components/admin/document-uploader.tsx`
- `hooks/use-documents.ts`

### Step 4.4 — Audit Log Viewer
- [ ] `app/(protected)/admin/logs/page.tsx` — Logs page
- [ ] `components/admin/audit-log-table.tsx` — Filterable table (date, action, user)
- [ ] `hooks/use-audit-logs.ts` — Fetch with filters

**Files:**
- `app/(protected)/admin/logs/page.tsx`
- `components/admin/audit-log-table.tsx`
- `hooks/use-audit-logs.ts`

### Step 4.5 — User Management
- [ ] `app/(protected)/admin/users/page.tsx` — Users page (admin only)
- [ ] `components/admin/user-table.tsx` — Table, role change dropdown, confirmation

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
