-- Documents table
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null check (category in (
    'policy',
    'regulation',
    'onboarding',
    'faq',
    'template',
    'job_description',
    'benefits',
    'evaluation',
    'disciplinary',
    'payroll'
  )),
  access_level text not null default 'all' check (access_level in ('all', 'hr_only')),
  file_name text,
  file_type text,
  embedding vector(1536),
  chunk_index integer default 0,
  parent_document_id uuid references public.documents(id) on delete cascade,
  version integer not null default 1,
  is_active boolean not null default true,
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

-- HNSW index for vector similarity search
create index idx_documents_embedding on public.documents
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Text search index for fallback
create index idx_documents_content_trgm on public.documents
  using gin (content gin_trgm_ops);

create index idx_documents_category on public.documents(category);
create index idx_documents_parent on public.documents(parent_document_id);
create index idx_documents_active on public.documents(is_active) where is_active = true;
