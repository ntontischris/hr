---
name: nextjs-app-router
description: Next.js 14/15 App Router patterns, server components, server actions, middleware, routing, caching, and data fetching. Use when creating pages, layouts, API routes, server actions, middleware, or when user mentions Next.js, App Router, RSC, server components, or routing.
---

# Next.js App Router Patterns

## File Conventions
```
app/
├── layout.tsx          # Root layout (wraps ALL pages)
├── page.tsx            # Home page (/)
├── loading.tsx         # Loading UI (automatic Suspense)
├── error.tsx           # Error boundary ('use client')
├── not-found.tsx       # 404 page
├── (auth)/             # Route group (no URL segment)
│   ├── login/page.tsx  # /login
│   └── signup/page.tsx # /signup
├── dashboard/
│   ├── layout.tsx      # Nested layout
│   ├── page.tsx        # /dashboard
│   └── [id]/page.tsx   # /dashboard/123 (dynamic)
└── api/
    └── webhooks/
        └── stripe/route.ts  # API route handler
```

## Server vs Client Components

### Default: Server Components (NO 'use client')
```typescript
// app/dashboard/page.tsx — Server Component (default)
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('*')
  
  return <ProjectList projects={data} />
}
```

### Client Components ONLY when needed
Use 'use client' ONLY for: onClick, onChange, useState, useEffect, browser APIs
```typescript
'use client'
// ONLY for interactivity
import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### Decision Rule
- Fetches data? → Server Component
- Has onClick/onChange/useState? → Client Component
- Both? → Server Component parent + Client Component child

## Server Actions
```typescript
// app/actions/projects.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('projects')
    .insert({ name: formData.get('name') as string })
  
  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard')
  redirect('/dashboard')
}
```

## API Route Handlers
```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  // Process webhook...
  return NextResponse.json({ received: true })
}

// Only export the HTTP methods you support
// GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
```

## Middleware
```typescript
// middleware.ts (root level ONLY)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Auth check, redirects, headers, etc.
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}
```

## Common Mistakes to Avoid
- DON'T use 'use client' on pages that just fetch data
- DON'T use useEffect for data fetching — use server components
- DON'T put middleware.ts inside app/ — it goes in project root
- DON'T use router.push for server-side redirects — use redirect()
- DON'T forget revalidatePath after mutations
- DON'T mix Pages Router (pages/) with App Router (app/) patterns
