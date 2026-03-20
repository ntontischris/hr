-- Audit logs table
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

-- Indexes
create index idx_audit_logs_created on public.audit_logs(created_at desc);
create index idx_audit_logs_user on public.audit_logs(user_id);
create index idx_audit_logs_action on public.audit_logs(action);
