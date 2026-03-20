-- Chat sessions table
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

-- Chat messages table (audit trail)
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources_used jsonb default '[]',
  tokens_used integer,
  model_used text,
  response_time_ms integer,
  feedback text check (feedback in ('positive', 'negative')),
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
