# HR AI Assistant - Product Requirements Document (PRD)

## Project Overview

### Description
Internal HR AI Assistant chatbot for a Greek company. The system answers employee questions about HR policies, supports onboarding, and helps HR managers with templates — all based exclusively on approved company HR documents.

### Key Features
- AI-powered Q&A based on HR documents (RAG with streaming)
- Role-based access (Employee vs HR Manager)
- Google/Microsoft OAuth authentication with corporate email
- Multi-turn conversation with context memory
- Complete audit trail of all conversations
- Admin dashboard for HR managers
- Document management with versioning
- Greek language support (primary), English fallback

### Tech Stack
- **Frontend**: Next.js 15 (App Router)
- **Backend**: Next.js Route Handlers + Server Actions
- **Database**: Supabase (PostgreSQL)
- **Vector DB**: pgvector (Supabase extension) with HNSW index
- **AI Chat**: OpenAI GPT-5 mini (cost-effective for RAG Q&A)
- **Embeddings**: OpenAI text-embedding-3-small
- **Auth**: Supabase Auth (`@supabase/ssr`) with OAuth
- **Validation**: Zod (all API boundaries)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Package Manager**: pnpm
- **Deployment**: Vercel (EU region - `fra1`)

### AI Provider Decision
**GPT-5 mini** chosen over Claude API for cost reasons:
- Single provider (OpenAI) for both embeddings and chat = simpler billing
- GPT-5 mini is sufficient for RAG-based Q&A (no complex multi-step reasoning needed)
- System prompts and role-based instructions work identically
- The architecture is provider-agnostic — can swap to Claude/other via a thin adapter if needed later

---

## Database Schema

### Extensions
```sql
create extension if not exists vector;
create extension if not exists pg_trgm; -- for text search fallback
```

### Tables

#### 1. profiles
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'employee' check (role in ('employee', 'hr_manager', 'admin')),
  department text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies (avoid recursive self-reference)
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- HR access via auth.jwt() to avoid recursive lookup
create policy "HR can view all profiles" on public.profiles
  for select using (
    (auth.jwt() ->> 'user_role') in ('hr_manager', 'admin')
  );

create policy "Admin can update roles" on public.profiles
  for update using (
    (auth.jwt() ->> 'user_role') = 'admin'
  );

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to sync role to JWT claims (for non-recursive RLS)
create or replace function public.sync_role_to_claims()
returns trigger as $$
begin
  update auth.users
  set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('user_role', new.role)
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_role_change
  after insert or update of role on public.profiles
  for each row execute procedure public.sync_role_to_claims();
```

#### 2. documents
```sql
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null check (category in (
    'policy',           -- HR πολιτικές
    'regulation',       -- Κανονισμός προσωπικού
    'onboarding',       -- Υλικό onboarding
    'faq',              -- Συχνές ερωτήσεις
    'template',         -- Templates (αγγελίες, emails)
    'job_description',  -- Περιγραφές θέσεων
    'benefits',         -- Παροχές
    'evaluation',       -- Αξιολογήσεις (HR only)
    'disciplinary',     -- Πειθαρχικά (HR only)
    'payroll'           -- Μισθοδοσία (HR only)
  )),
  access_level text not null default 'all' check (access_level in ('all', 'hr_only')),
  file_name text,
  file_type text,
  embedding vector(1536),
  chunk_index integer default 0,
  parent_document_id uuid references public.documents(id) on delete cascade,
  version integer not null default 1,
  is_active boolean not null default true, -- soft delete for versioning
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references public.profiles(id)
);

-- Enable RLS
alter table public.documents enable row level security;

-- Policies
create policy "Employees see public active docs" on public.documents
  for select using (
    is_active = true
    and (
      access_level = 'all'
      or (auth.jwt() ->> 'user_role') in ('hr_manager', 'admin')
    )
  );

create policy "HR can manage docs" on public.documents
  for all using (
    (auth.jwt() ->> 'user_role') in ('hr_manager', 'admin')
  );

-- HNSW index (better for small-to-medium datasets, no training needed)
create index idx_documents_embedding on public.documents
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Text search index for fallback
create index idx_documents_content_trgm on public.documents
  using gin (content gin_trgm_ops);

create index idx_documents_category on public.documents(category);
create index idx_documents_parent on public.documents(parent_document_id);
create index idx_documents_active on public.documents(is_active) where is_active = true;
```

#### 3. chat_sessions
```sql
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  is_archived boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.chat_sessions enable row level security;

-- Policies
create policy "Users manage own sessions" on public.chat_sessions
  for all using (auth.uid() = user_id);

create policy "HR can view all sessions" on public.chat_sessions
  for select using (
    (auth.jwt() ->> 'user_role') in ('hr_manager', 'admin')
  );
```

#### 4. chat_messages (Audit Trail)
```sql
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources_used jsonb default '[]',
  tokens_used integer,
  model_used text, -- track which model generated response
  response_time_ms integer, -- track latency
  feedback text check (feedback in ('positive', 'negative')), -- user feedback
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.chat_messages enable row level security;

-- Policies
create policy "Users manage own messages" on public.chat_messages
  for all using (auth.uid() = user_id);

create policy "HR can view all messages" on public.chat_messages
  for select using (
    (auth.jwt() ->> 'user_role') in ('hr_manager', 'admin')
  );

-- Indexes
create index idx_chat_messages_session on public.chat_messages(session_id, created_at asc);
create index idx_chat_messages_user on public.chat_messages(user_id);
create index idx_chat_messages_created on public.chat_messages(created_at desc);
```

#### 5. audit_logs
```sql
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  user_email text not null,
  action text not null check (action in (
    'chat', 'document_upload', 'document_delete', 'document_update',
    'login', 'logout', 'role_change', 'settings_change'
  )),
  details jsonb default '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Only HR can view (no public insert — use service role server-side)
create policy "HR can view logs" on public.audit_logs
  for select using (
    (auth.jwt() ->> 'user_role') in ('hr_manager', 'admin')
  );

-- NOTE: Inserts happen server-side via service role client only.
-- No "anyone can insert" policy — that was a security hole.

-- Indexes
create index idx_audit_logs_created on public.audit_logs(created_at desc);
create index idx_audit_logs_user on public.audit_logs(user_id);
create index idx_audit_logs_action on public.audit_logs(action);
```

#### 6. rate_limits (optional, for API throttling)
```sql
create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null,
  request_count integer not null default 1,
  window_start timestamptz not null default now(),
  constraint unique_user_endpoint_window unique (user_id, endpoint, window_start)
);

-- Cleanup function (run via pg_cron daily)
create or replace function cleanup_rate_limits()
returns void as $$
begin
  delete from public.rate_limits where window_start < now() - interval '1 hour';
end;
$$ language plpgsql;
```

### Database Functions

#### Similarity Search Function
```sql
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  p_access_level text default 'all' -- 'all' for employees, 'hr_only' for HR
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  similarity float
)
language plpgsql
security definer -- runs with table owner privileges
set search_path = public
as $$
begin
  return query
  select
    d.id,
    d.title,
    d.content,
    d.category,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where
    d.is_active = true
    and d.embedding is not null
    and 1 - (d.embedding <=> query_embedding) > match_threshold
    and (
      d.access_level = 'all'
      or p_access_level = 'hr_only' -- HR sees everything
    )
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

#### Hybrid Search (vector + text fallback)
```sql
create or replace function hybrid_search(
  query_text text,
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 5,
  p_access_level text default 'all'
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  score float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  -- Combine vector similarity with text matching
  select
    d.id,
    d.title,
    d.content,
    d.category,
    greatest(
      1 - (d.embedding <=> query_embedding),
      similarity(d.content, query_text) * 0.8
    ) as score
  from public.documents d
  where
    d.is_active = true
    and (
      (d.embedding is not null and 1 - (d.embedding <=> query_embedding) > match_threshold)
      or similarity(d.content, query_text) > 0.3
    )
    and (
      d.access_level = 'all'
      or p_access_level = 'hr_only'
    )
  order by score desc
  limit match_count;
end;
$$;
```

---

## Authentication & Authorization

### Supabase Auth Configuration (`@supabase/ssr`)

#### Allowed Email Domains
Configure in Supabase Dashboard → Authentication → Providers:
- Restrict to company domain (e.g., `@company.gr`)

#### OAuth Providers Setup

**Google OAuth:**
1. Create project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`

**Microsoft OAuth (Azure AD):**
1. Register app in Azure Portal
2. Configure redirect URI
3. Add client ID and secret to Supabase

### Role Assignment Logic
```typescript
// lib/auth/roles.ts
import { z } from 'zod';

const RoleSchema = z.enum(['employee', 'hr_manager', 'admin']);
type Role = z.infer<typeof RoleSchema>;

// Configure HR manager emails in env or DB — NOT hardcoded
const HR_MANAGER_EMAILS = (process.env.HR_MANAGER_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export function resolveUserRole(email: string): Role {
  if (HR_MANAGER_EMAILS.includes(email.toLowerCase())) {
    return 'hr_manager';
  }
  return 'employee';
}
```

### Middleware for Route Protection
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res = NextResponse.next({ request: req });
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: use getUser() not getSession() for security
  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes — redirect to login if unauthenticated
  if (!user && req.nextUrl.pathname.startsWith('/chat')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admin routes — check role from JWT claims
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const role = user?.app_metadata?.user_role;
    if (!role || !['hr_manager', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL('/chat', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/chat/:path*', '/admin/:path*', '/api/:path*']
};
```

---

## Project Structure

```
hr-assistant/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Landing page / redirect
│   ├── globals.css                # Global styles
│   ├── loading.tsx                # Global loading state
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx           # Login page
│   │   ├── callback/
│   │   │   └── route.ts           # OAuth callback handler
│   │   └── logout/
│   │       └── route.ts           # Logout handler
│   │
│   ├── (protected)/
│   │   ├── layout.tsx             # Protected layout with sidebar
│   │   ├── loading.tsx            # Protected area loading state
│   │   │
│   │   ├── chat/
│   │   │   ├── page.tsx           # Main chat interface
│   │   │   ├── loading.tsx        # Chat loading skeleton
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx       # Specific chat session
│   │   │
│   │   └── admin/
│   │       ├── layout.tsx         # Admin layout (HR only)
│   │       ├── page.tsx           # Admin dashboard
│   │       ├── loading.tsx        # Admin loading state
│   │       ├── documents/
│   │       │   └── page.tsx       # Document management
│   │       ├── logs/
│   │       │   └── page.tsx       # Audit logs viewer
│   │       └── users/
│   │           └── page.tsx       # User management
│   │
│   └── api/
│       ├── chat/
│       │   └── route.ts           # Chat endpoint (POST, streaming)
│       ├── documents/
│       │   ├── route.ts           # List/Create documents
│       │   ├── [id]/
│       │   │   └── route.ts       # Get/Update/Delete document
│       │   ├── upload/
│       │   │   └── route.ts       # Upload & embed document
│       │   └── search/
│       │       └── route.ts       # Semantic search
│       ├── sessions/
│       │   ├── route.ts           # List/Create sessions
│       │   └── [id]/
│       │       └── route.ts       # Get/Delete session
│       ├── feedback/
│       │   └── route.ts           # Message feedback (thumbs up/down)
│       ├── logs/
│       │   └── route.ts           # Get audit logs (HR only)
│       └── users/
│           └── route.ts           # User management (HR only)
│
├── components/
│   ├── ui/                        # shadcn/ui components
│   │
│   ├── chat/
│   │   ├── chat-interface.tsx     # Main chat component
│   │   ├── message-list.tsx       # Message display
│   │   ├── message-bubble.tsx     # Individual message with streaming
│   │   ├── chat-input.tsx         # Input with send button
│   │   ├── source-citation.tsx    # Document sources
│   │   ├── typing-indicator.tsx   # Loading state
│   │   ├── session-list.tsx       # Chat history sidebar
│   │   └── feedback-buttons.tsx   # Thumbs up/down per message
│   │
│   ├── admin/
│   │   ├── document-uploader.tsx  # Upload documents
│   │   ├── document-list.tsx      # List all documents
│   │   ├── audit-log-table.tsx    # Logs table
│   │   ├── stats-cards.tsx        # Dashboard stats
│   │   └── user-table.tsx         # User management
│   │
│   ├── layout/
│   │   ├── sidebar.tsx            # Navigation sidebar
│   │   ├── header.tsx             # Top header
│   │   ├── user-menu.tsx          # User dropdown
│   │   └── mobile-nav.tsx         # Mobile navigation
│   │
│   └── providers/
│       ├── supabase-provider.tsx  # Supabase client provider
│       └── theme-provider.tsx     # Dark/light theme
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client (@supabase/ssr)
│   │   ├── server.ts              # Server client (@supabase/ssr)
│   │   └── admin.ts               # Admin/service role client
│   │
│   ├── ai/
│   │   ├── client.ts              # OpenAI client (single provider)
│   │   ├── chat.ts                # Chat completion with streaming
│   │   ├── embeddings.ts          # Embedding generation (batch support)
│   │   └── prompts.ts             # System prompts (Greek/English)
│   │
│   ├── documents/
│   │   ├── parser.ts              # PDF/DOCX text extraction
│   │   ├── chunker.ts             # Text chunking with overlap
│   │   └── processor.ts           # Document processing pipeline
│   │
│   ├── validators/
│   │   ├── chat.ts                # Chat input schemas (Zod)
│   │   ├── documents.ts           # Document schemas (Zod)
│   │   └── common.ts              # Shared schemas
│   │
│   └── types/
│       ├── database.ts            # Supabase generated types
│       └── api.ts                 # API request/response types
│
├── hooks/
│   ├── use-chat.ts                # Chat state management
│   ├── use-session.ts             # Auth session
│   ├── use-documents.ts           # Document operations
│   └── use-audit-logs.ts          # Logs fetching
│
├── public/
│   ├── logo.svg
│   └── favicon.ico
│
├── .env.local                     # Environment variables
├── middleware.ts                  # Route protection
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── pnpm-lock.yaml
└── package.json
```

---

## API Routes

### POST /api/chat (Streaming)
Main chat endpoint with RAG and streaming response.

```typescript
// app/api/chat/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { streamChatResponse } from '@/lib/ai/chat';
import { createAdminClient } from '@/lib/supabase/admin';

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const supabase = createServerClient(/* cookies config */);

  // IMPORTANT: getUser() not getSession()
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate input
  const body = await request.json();
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { message, sessionId } = parsed.data;
  const userRole = user.app_metadata?.user_role ?? 'employee';

  // Generate embedding for the question
  const queryEmbedding = await generateEmbedding(message);

  // Hybrid search for relevant documents (respecting role)
  const { data: relevantDocs } = await supabase.rpc('hybrid_search', {
    query_text: message,
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: 5,
    p_access_level: ['hr_manager', 'admin'].includes(userRole) ? 'hr_only' : 'all'
  });

  // Load last N messages for multi-turn context
  let conversationHistory: Array<{ role: string; content: string }> = [];
  if (sessionId) {
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10); // last 10 messages for context
    conversationHistory = history ?? [];
  }

  // Build context from documents
  const context = relevantDocs
    ?.map(doc => `[${doc.title}]\n${doc.content}`)
    .join('\n\n---\n\n') ?? '';

  // Create or reuse session
  const adminClient = createAdminClient();
  let activeSessionId = sessionId;

  if (!activeSessionId) {
    const { data: newSession } = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id, title: message.slice(0, 50) })
      .select('id')
      .single();
    activeSessionId = newSession?.id;
  }

  // Save user message
  await supabase.from('chat_messages').insert({
    session_id: activeSessionId,
    user_id: user.id,
    role: 'user',
    content: message,
  });

  // Stream response
  const startTime = Date.now();

  const stream = await streamChatResponse({
    message,
    context,
    conversationHistory,
    userRole,
    language: 'el',
  });

  // Return streaming response with metadata in headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Session-Id': activeSessionId!,
      'X-Sources': JSON.stringify(
        relevantDocs?.map(d => ({ id: d.id, title: d.title, category: d.category })) ?? []
      ),
    },
  });

  // NOTE: Assistant message saved via stream completion callback in streamChatResponse
  // Audit log written via service role in the same callback
}
```

### POST /api/documents/upload
Document upload with batch embedding.

```typescript
// app/api/documents/upload/route.ts
import { z } from 'zod';
import { extractText } from '@/lib/documents/parser';
import { chunkText } from '@/lib/documents/chunker';
import { generateEmbeddings } from '@/lib/ai/embeddings';

const UploadSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum([
    'policy', 'regulation', 'onboarding', 'faq', 'template',
    'job_description', 'benefits', 'evaluation', 'disciplinary', 'payroll'
  ]),
  accessLevel: z.enum(['all', 'hr_only']).default('all'),
});

export async function POST(request: Request) {
  // ... auth + HR role check (using getUser()) ...

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const metadata = UploadSchema.parse({
    title: formData.get('title'),
    category: formData.get('category'),
    accessLevel: formData.get('accessLevel'),
  });

  // Extract text
  const text = await extractText(file);

  // Chunk text
  const chunks = chunkText(text, { chunkSize: 1000, chunkOverlap: 200 });

  // Batch generate embeddings (much faster than sequential)
  const embeddings = await generateEmbeddings(chunks);

  // Create parent document
  const { data: parentDoc } = await supabase
    .from('documents')
    .insert({
      title: metadata.title,
      content: text,
      category: metadata.category,
      access_level: metadata.accessLevel,
      file_name: file.name,
      file_type: file.type,
      created_by: user.id,
    })
    .select('id')
    .single();

  // Bulk insert chunks with embeddings
  const chunkRows = chunks.map((chunk, i) => ({
    title: `${metadata.title} - Chunk ${i + 1}`,
    content: chunk,
    category: metadata.category,
    access_level: metadata.accessLevel,
    embedding: embeddings[i],
    chunk_index: i,
    parent_document_id: parentDoc!.id,
    created_by: user.id,
  }));

  await supabase.from('documents').insert(chunkRows);

  // Audit log via service role
  await adminClient.from('audit_logs').insert({
    user_id: user.id,
    user_email: user.email!,
    action: 'document_upload',
    details: { title: metadata.title, category: metadata.category, chunks: chunks.length },
  });

  return Response.json({ documentId: parentDoc!.id });
}
```

---

## AI Implementation

### OpenAI Client (Single Provider)
```typescript
// lib/ai/client.ts
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
```

### Chat with Streaming
```typescript
// lib/ai/chat.ts
import { openai } from './client';
import { SYSTEM_PROMPTS } from './prompts';

interface ChatParams {
  message: string;
  context: string;
  conversationHistory: Array<{ role: string; content: string }>;
  userRole: string;
  language: 'el' | 'en';
}

export async function streamChatResponse(params: ChatParams): Promise<ReadableStream> {
  const { message, context, conversationHistory, userRole, language } = params;

  const systemPrompt = SYSTEM_PROMPTS[language](userRole);

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    // Include conversation history for multi-turn
    ...conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    {
      role: 'user' as const,
      content: `ΔΙΑΘΕΣΙΜΑ ΕΓΓΡΑΦΑ HR:\n---\n${context}\n---\n\nΕΡΩΤΗΣΗ:\n${message}\n\nΑπάντησε με βάση τα παραπάνω έγγραφα.`,
    },
  ];

  const stream = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages,
    max_tokens: 2048,
    temperature: 0.3, // low for factual HR answers
    stream: true,
  });

  // Convert to ReadableStream for Response
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
      }
      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}
```

### System Prompts
```typescript
// lib/ai/prompts.ts
export const SYSTEM_PROMPTS = {
  el: (userRole: string) => `Είσαι ο HR Assistant, ένας φιλικός και επαγγελματικός βοηθός για θέματα Ανθρώπινου Δυναμικού.

ΚΑΝΟΝΕΣ:
1. Απαντάς ΜΟΝΟ με βάση τα έγγραφα που σου δίνονται στο context
2. Αν δεν βρίσκεις σχετική πληροφορία, πες ευγενικά ότι δεν έχεις αυτή την πληροφορία και πρότεινε επικοινωνία με το HR
3. Μίλα πάντα στα Ελληνικά
4. Να είσαι σαφής και περιεκτικός
5. Αναφέρου στην πηγή (τίτλο εγγράφου) όταν δίνεις πληροφορίες
6. ΜΗΝ δίνεις νομικές συμβουλές — παραπέμπε στο HR για σύνθετα ζητήματα
7. Αν σε ρωτήσουν κάτι εκτός HR, πες ότι μπορείς να βοηθήσεις μόνο με θέματα HR

ΡΟΛΟΣ ΧΡΗΣΤΗ: ${userRole}
${userRole === 'employee'
  ? '- Δίνε μόνο γενικές πληροφορίες (άδειες, παροχές, πολιτικές)'
  : `- Μπορείς να συζητήσεις θέματα μισθοδοσίας, αξιολογήσεων, πειθαρχικών
- Μπορείς να βοηθήσεις με templates αγγελιών, emails, περιγραφές θέσεων
- Δώσε λεπτομερείς απαντήσεις με αναφορές σε πολιτικές`
}`,

  en: (userRole: string) => `You are the HR Assistant...`, // English version if needed
};
```

### Embeddings (Batch Support)
```typescript
// lib/ai/embeddings.ts
import { openai } from './client';

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Batch in groups of 100 (OpenAI limit per request)
  const BATCH_SIZE = 100;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
      dimensions: 1536,
    });
    results.push(...response.data.map(d => d.embedding));
  }

  return results;
}
```

---

## Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx

# OpenAI (single provider for both chat + embeddings)
OPENAI_API_KEY=sk-xxxxx

# App
NEXT_PUBLIC_APP_URL=https://hr-assistant.company.gr

# Auth
ALLOWED_EMAIL_DOMAIN=company.gr
HR_MANAGER_EMAILS=hr@company.gr,hr.manager@company.gr

# Rate Limiting
RATE_LIMIT_CHAT_PER_MINUTE=20
RATE_LIMIT_UPLOAD_PER_HOUR=50
```

---

## Deployment

### Vercel Configuration
```json
{
  "regions": ["fra1"],
  "functions": {
    "app/api/chat/route.ts": {
      "maxDuration": 60
    },
    "app/api/documents/upload/route.ts": {
      "maxDuration": 120
    },
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Build Commands
```bash
pnpm install
pnpm dlx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.ts
pnpm build
vercel --prod
```

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Init Next.js 15 project with TypeScript + pnpm
- [ ] Setup Supabase project (EU region)
- [ ] Create all tables, indexes, RLS policies, functions
- [ ] Configure OAuth (Google + Microsoft)
- [ ] Setup `@supabase/ssr` client (browser + server + admin)
- [ ] Install and configure shadcn/ui + Tailwind v4
- [ ] Setup middleware with `getUser()` auth checks
- [ ] Add Zod validators for all API inputs

### Phase 2: RAG Pipeline (Week 2)
- [ ] Implement document upload + text extraction (PDF, DOCX, TXT)
- [ ] Implement text chunking with paragraph-aware splitting
- [ ] Batch embedding generation
- [ ] Hybrid search function (vector + trigram fallback)
- [ ] Build chat API with streaming (SSE)
- [ ] Multi-turn conversation context (last 10 messages)
- [ ] Rate limiting middleware

### Phase 3: Frontend (Week 3)
- [ ] Chat interface with streaming message display
- [ ] Session list sidebar (create, archive, switch)
- [ ] Source citations display
- [ ] Message feedback (thumbs up/down)
- [ ] Welcome screen with suggested questions
- [ ] Mobile responsive layout
- [ ] Loading skeletons for all pages

### Phase 4: Admin Dashboard (Week 4)
- [ ] Admin layout with role gating
- [ ] Document management (upload, list, soft-delete, version)
- [ ] Audit log viewer with filters (date, action, user)
- [ ] User management (view users, change roles)
- [ ] Analytics cards (total chats, active users, popular topics, feedback score)

### Phase 5: Polish & Launch (Week 5)
- [ ] Setup Vercel deployment (EU region, `fra1`)
- [ ] Configure custom domain + SSL
- [ ] Security audit (RLS, auth, input validation)
- [ ] Performance testing (streaming latency, search speed)
- [ ] Load initial HR documents
- [ ] Pilot with 5-10 test users
- [ ] Iterate based on feedback
- [ ] Training session for HR team
- [ ] Go live

---

## Dependencies

```json
{
  "dependencies": {
    "openai": "^4.80.0",
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.49.0",
    "next": "^15.2.0",
    "react": "^19",
    "react-dom": "^19",
    "zod": "^3.24.0",
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.8.0",
    "tailwindcss": "^4.0.0",
    "lucide-react": "^0.470.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.7.0"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "typescript": "^5.7",
    "supabase": "^2.15.0",
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.0.0"
  }
}
```

---

## Greek Language Notes

- All user-facing text in Greek
- System prompts in Greek
- Error messages in Greek
- Date format: DD/MM/YYYY (use `el-GR` locale)
- Number format: 1.234,56 (dot for thousands, comma for decimals)

---

## Cost Estimation (GPT-5 mini)

### Assumptions
- ~50 employees, ~20 questions/day average
- Average context: ~3000 tokens input, ~500 tokens output per query
- ~5 document uploads/week

### Monthly Estimates
- **Chat**: 600 queries × ~3500 input tokens × $0.XX/1M + 600 × 500 output tokens × $0.XX/1M
- **Embeddings**: ~600 queries + ~50 chunks/month ≈ 650 × $0.02/1M tokens
- **Supabase**: Free tier likely sufficient (or Pro $25/mo for production)
- **Vercel**: Free tier or Pro $20/mo

**Total estimated: significantly lower than Claude API for equivalent usage.**
(Update with actual GPT-5 mini pricing when available)

---

## Architecture Notes for fullstack-architect

### Key Design Decisions
1. **Single AI provider (OpenAI)** — simplifies billing, SDK management, and error handling
2. **Hybrid search** — vector + trigram fallback ensures results even for exact term matches
3. **Streaming responses** — critical for UX, users see response building in real-time
4. **Multi-turn context** — last 10 messages sent to LLM for conversational continuity
5. **JWT-based role checks in RLS** — avoids recursive profile lookups in policies
6. **Service role for audit logs** — no public insert policy, prevents log injection
7. **Batch embeddings** — parallel processing for document upload speed
8. **Soft delete for documents** — enables versioning and rollback
9. **Rate limiting** — prevents abuse and controls AI costs

### Risks to Address
- **Greek language quality**: Test GPT-5 mini Greek output quality early; have fallback to GPT-5 if mini insufficient
- **Document parsing**: PDF extraction quality varies; may need OCR for scanned documents
- **pgvector scale**: HNSW index performs well up to ~1M vectors; sufficient for HR use case
- **Auth edge cases**: Handle expired sessions, concurrent logins, corporate SSO requirements
