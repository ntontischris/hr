-- Rate limits table
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
