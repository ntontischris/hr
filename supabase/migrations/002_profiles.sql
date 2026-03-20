-- Profiles table
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
