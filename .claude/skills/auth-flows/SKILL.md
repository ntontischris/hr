---
name: auth-flows
description: Authentication and authorization patterns. Email/password, OAuth, magic links, session management, protected routes, role-based access. Use when user mentions auth, login, signup, session, OAuth, Google sign in, magic link, protected routes, or role-based access.
---

# Authentication Flows (Next.js + Supabase)

## Auth Options

### Email/Password
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email, password,
  options: {
    data: { full_name: name },  // stored in auth.users.raw_user_meta_data
    emailRedirectTo: `${origin}/auth/callback`,
  }
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
})
```

### OAuth (Google, GitHub, etc.)
```typescript
// Initiate OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    }
  }
})

// Callback handler — app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
```

### Magic Link
```typescript
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: `${origin}/auth/callback` }
})
```

## Protected Routes Pattern

### Middleware (recommended)
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  // Public routes
  const publicPaths = ['/login', '/signup', '/', '/pricing']
  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
```

### Server Component Check
```typescript
// For page-level protection
export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')
  
  return <Dashboard user={user} />
}
```

## Role-Based Access
```sql
-- Database: add role to profiles
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' 
  CHECK (role IN ('user', 'admin', 'moderator'));

-- RLS: admin-only access
CREATE POLICY "Admins see all" ON admin_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

```typescript
// Helper
export async function requireRole(role: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== role) redirect('/unauthorized')
  return user
}

// Usage in page
export default async function AdminPage() {
  const user = await requireRole('admin')
  return <AdminDashboard />
}
```

## Sign Out
```typescript
'use server'
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

## Profiles Sync (auto-create profile on signup)
```sql
-- Trigger: create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Common Mistakes
- ALWAYS use getUser() not getSession() for server-side auth checks
- NEVER check auth only in client components — always verify server-side
- ALWAYS handle the redirect after OAuth callback
- DON'T store sensitive user data in raw_user_meta_data — use your own profiles table
- ALWAYS add email verification for production
