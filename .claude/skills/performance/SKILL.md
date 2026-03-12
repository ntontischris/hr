---
name: performance
description: Performance optimization for Next.js and Supabase. Caching, lazy loading, image optimization, query optimization, bundle size, Core Web Vitals. Use when user mentions performance, slow, optimization, caching, loading speed, Core Web Vitals, or bundle size.
---

# Performance Patterns

## Next.js Caching
```typescript
// Static page (cached at build time)
export const revalidate = 3600  // Revalidate every hour

// Dynamic but cached
import { unstable_cache } from 'next/cache'

const getProjects = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data } = await supabase.from('projects').select().eq('user_id', userId)
    return data
  },
  ['projects'],  // cache key
  { revalidate: 60, tags: ['projects'] }  // 60 seconds
)

// Invalidate
import { revalidateTag } from 'next/cache'
revalidateTag('projects')
```

## Supabase Query Optimization
```typescript
// BAD: N+1 query
for (const project of projects) {
  const { data } = await supabase.from('tasks').select().eq('project_id', project.id)
}

// GOOD: Single query with join
const { data } = await supabase
  .from('projects')
  .select('*, tasks(*)')  // Join in one query

// GOOD: Select only what you need
const { data } = await supabase
  .from('projects')
  .select('id, name, created_at')  // Not select('*')

// GOOD: Add database indexes
// CREATE INDEX idx_tasks_project ON tasks(project_id);
```

## Image Optimization
```tsx
import Image from 'next/image'

// ALWAYS use next/image — auto-optimizes, lazy loads, responsive
<Image 
  src="/hero.jpg" 
  alt="Hero"
  width={1200} 
  height={600}
  priority  // Only for above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

## Bundle Size
```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,  // Don't render on server
})

// Check bundle size
// npx @next/bundle-analyzer
```

## Loading States
```tsx
// app/dashboard/loading.tsx — Automatic Suspense
export default function Loading() {
  return <DashboardSkeleton />
}

// Streaming with Suspense
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsList />  {/* Server component, can be slow */}
      </Suspense>
    </div>
  )
}
```

## Quick Wins
1. Use `select('specific, columns')` not `select('*')`
2. Add database indexes for filtered/sorted columns
3. Use `next/image` for all images
4. Lazy load below-fold components with `dynamic()`
5. Add `loading.tsx` for instant perceived performance
6. Use `priority` only on LCP (largest contentful paint) image
