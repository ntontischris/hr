---
name: api-design
description: RESTful API design patterns for Next.js App Router. Route handlers, input validation with Zod, error handling, response format, rate limiting, and middleware. Use when user mentions API, endpoints, routes, REST, validation, or Zod.
---

# API Design Patterns (Next.js App Router)

## Response Envelope
```typescript
// lib/api/response.ts
type ApiResponse<T> = {
  data: T | null
  error: string | null
  meta?: { page?: number; total?: number }
}

export function success<T>(data: T, meta?: object): Response {
  return Response.json({ data, error: null, ...meta && { meta } })
}

export function error(message: string, status: number = 400): Response {
  return Response.json({ data: null, error: message }, { status })
}
```

## Route Handler Pattern
```typescript
// app/api/projects/route.ts
import { createClient } from '@/lib/supabase/server'
import { success, error } from '@/lib/api/response'
import { createProjectSchema } from './schema'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return error('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)

  const { data, count } = await supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .range((page - 1) * limit, page * limit - 1)
    .order('created_at', { ascending: false })

  return success(data, { meta: { page, total: count } })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return error('Unauthorized', 401)

  const body = await request.json()
  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 422)
  }

  const { data, error: dbError } = await supabase
    .from('projects')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (dbError) return error(dbError.message, 500)
  return success(data)
}
```

## Zod Validation
```typescript
// app/api/projects/schema.ts
import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  description: z.string().max(500).optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
```

## URL Convention
```
GET    /api/projects          # List
POST   /api/projects          # Create
GET    /api/projects/[id]     # Get one
PATCH  /api/projects/[id]     # Update
DELETE /api/projects/[id]     # Delete
```

## Common Mistakes
- ALWAYS validate input with Zod — never trust request.json()
- ALWAYS check auth first — return 401 before any logic
- ALWAYS limit pagination (max 100)
- NEVER expose internal error details to client
- NEVER use GET for mutations
