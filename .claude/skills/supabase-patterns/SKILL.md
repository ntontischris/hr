---
name: supabase-patterns
description: Supabase patterns for Next.js including auth, database queries, Row Level Security, realtime subscriptions, storage, and edge functions. Use when user mentions Supabase, database queries, RLS, auth, storage buckets, realtime, or Postgres functions.
---

# Supabase Patterns (Next.js)

## Client Setup

### Server-side client (Server Components, Server Actions, Route Handlers)
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}
```

### Browser client (Client Components)
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Admin client (bypasses RLS — server only, NEVER expose)
```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // NEVER in client code
)
```

## Auth Patterns

### Sign up / Sign in
```typescript
'use server'
export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) redirect('/login?error=' + encodeURIComponent(error.message))
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
```

### Auth middleware
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}
```

## Database Query Patterns

### Basic CRUD
```typescript
// SELECT with filters
const { data, error } = await supabase
  .from('projects')
  .select('id, name, created_at, profiles(full_name)')  // joins!
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20)

// INSERT
const { data, error } = await supabase
  .from('projects')
  .insert({ name, user_id: userId })
  .select()
  .single()

// UPDATE
const { error } = await supabase
  .from('projects')
  .update({ name: newName })
  .eq('id', projectId)

// DELETE
const { error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId)
```

### Pagination
```typescript
const PAGE_SIZE = 20
const from = page * PAGE_SIZE
const to = from + PAGE_SIZE - 1

const { data, count } = await supabase
  .from('projects')
  .select('*', { count: 'exact' })
  .range(from, to)
  .order('created_at', { ascending: false })
```

## Row Level Security (RLS)

### ALWAYS enable RLS on every table
```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users see own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own data
CREATE POLICY "Users create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own data
CREATE POLICY "Users update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own data  
CREATE POLICY "Users delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);
```

### Common RLS Patterns
```sql
-- Team access: user belongs to same org
CREATE POLICY "Team members see org data" ON projects
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Public read, authenticated write
CREATE POLICY "Public read" ON posts
  FOR SELECT USING (published = true);

CREATE POLICY "Authors write" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);
```

## Storage
```typescript
// Upload
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file, {
    cacheControl: '3600',
    upsert: true,
  })

// Get public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`)
```

## Realtime
```typescript
'use client'
useEffect(() => {
  const channel = supabase
    .channel('projects')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'projects' },
      (payload) => { /* handle change */ }
    )
    .subscribe()
  
  return () => { supabase.removeChannel(channel) }
}, [])
```

## Common Mistakes
- NEVER use service_role key in client code
- ALWAYS enable RLS on every table — no exceptions
- ALWAYS use supabase.auth.getUser() (server-validated), NOT getSession() (trusts JWT)
- DON'T forget to handle { error } — Supabase doesn't throw
- DON'T use the admin client unless you specifically need to bypass RLS
