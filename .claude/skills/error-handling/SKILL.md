---
name: error-handling
description: Error handling patterns for Next.js, Supabase, Stripe, and API integrations. Error boundaries, custom error classes, logging, user-facing errors, and toast notifications. Use when user mentions errors, error handling, try/catch, error boundary, or error messages.
---

# Error Handling Patterns

## Custom Error Class
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class AuthError extends AppError {
  constructor(message = 'Not authenticated') {
    super(message, 401, 'AUTH_ERROR')
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, 'VALIDATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}
```

## Server Action Error Handling
```typescript
'use server'

type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }

export async function createProject(formData: FormData): Promise<ActionResult<Project>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const name = formData.get('name') as string
    if (!name) return { success: false, error: 'Name is required' }

    const { data, error } = await supabase
      .from('projects')
      .insert({ name, user_id: user.id })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (e) {
    console.error('createProject failed:', e)
    return { success: false, error: 'Something went wrong' }
  }
}
```

## Error Boundary (Client)
```typescript
// app/error.tsx
'use client'

export default function Error({
  error, reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## Supabase Error Handling
```typescript
// Supabase NEVER throws — always check { error }
const { data, error } = await supabase.from('projects').select()

if (error) {
  if (error.code === 'PGRST116') {
    // Row not found
  } else if (error.code === '23505') {
    // Unique constraint violation
  } else if (error.code === '42501') {
    // RLS policy violation — user not authorized
  }
}
```

## Golden Rules
1. Never show raw error messages to users — map to friendly messages
2. Always log the full error server-side
3. Supabase doesn't throw — ALWAYS check the error field
4. Return typed results from server actions — not throw
5. Use error.tsx for page-level errors, try/catch for component-level
