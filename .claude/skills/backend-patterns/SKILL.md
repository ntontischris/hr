---
name: backend-patterns
description: Backend architecture patterns including service layer, repository pattern, caching, background jobs, queues, and API rate limiting. Use when user mentions backend, service, repository, caching, queue, or API architecture.
---

# Backend Architecture Patterns

## Service Layer Pattern
```typescript
// services/project-service.ts
export class ProjectService {
  constructor(
    private db: SupabaseClient,
    private cache?: CacheService
  ) {}

  async create(input: CreateProjectInput, userId: string) {
    // 1. Validate
    const parsed = createProjectSchema.parse(input)
    
    // 2. Business logic
    const slug = generateSlug(parsed.name)
    
    // 3. Persist
    const { data, error } = await this.db
      .from('projects')
      .insert({ ...parsed, slug, user_id: userId })
      .select()
      .single()
    
    if (error) throw new AppError(error.message, 500)
    
    // 4. Side effects
    await this.cache?.invalidate(`projects:${userId}`)
    
    return data
  }
}
```

## Repository Pattern
```typescript
// repositories/project-repository.ts
export class ProjectRepository {
  constructor(private db: SupabaseClient) {}

  async findByUserId(userId: string, options?: { page: number; limit: number }) {
    const { page = 1, limit = 20 } = options ?? {}
    const from = (page - 1) * limit
    
    return this.db
      .from('projects')
      .select('id, name, slug, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
  }

  async findById(id: string) {
    return this.db
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
  }
}
```

## Caching Pattern
```typescript
// lib/cache.ts
const cache = new Map<string, { data: unknown; expiry: number }>()

export function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const entry = cache.get(key)
  if (entry && entry.expiry > Date.now()) {
    return Promise.resolve(entry.data as T)
  }
  
  return fn().then(data => {
    cache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 })
    return data
  })
}

// Usage
const projects = await cached(`projects:${userId}`, 60, () =>
  projectRepo.findByUserId(userId)
)
```

## Rate Limiting (API Routes)
```typescript
// lib/rate-limit.ts
const requests = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = requests.get(key) ?? []
  const recent = timestamps.filter(t => now - t < windowMs)
  
  if (recent.length >= limit) return false
  
  recent.push(now)
  requests.set(key, recent)
  return true
}

// In route handler
const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
if (!rateLimit(ip, 100, 60000)) {
  return error('Too many requests', 429)
}
```

## Background Jobs
```typescript
// For simple delayed tasks without a queue
async function processAfterResponse(fn: () => Promise<void>) {
  // Fire-and-forget with error logging
  fn().catch(err => console.error('Background job failed:', err))
}

// Usage in API route
const response = NextResponse.json({ success: true })
processAfterResponse(async () => {
  await sendWelcomeEmail(user.email)
  await trackEvent('user_signup', { userId: user.id })
})
return response
```

## Architecture Rules
- Services contain business logic — NOT route handlers
- Repositories handle data access only — no business rules
- Route handlers: validate → call service → return response
- Keep the dependency chain: Route → Service → Repository → Database
- Never import a service from another service (use events or orchestrator)
