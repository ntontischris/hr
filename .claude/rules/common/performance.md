# Performance Rules (Always Active)

## Context Window Management
- Use /clear after every completed task
- Use subagents for heavy exploration — they get their own context
- Don't @-embed large files — reference paths instead
- Prefer Sonnet for implementation, Opus for planning, Haiku for exploration

## Database
- NEVER use select('*') — specify columns
- Add indexes for columns used in WHERE, ORDER BY, JOIN
- Use single queries with joins instead of N+1 loops
- Paginate all list queries (max 100 per page)

## Next.js
- Default to Server Components — 'use client' only for interactivity
- Use next/image for ALL images
- Lazy load below-fold components with dynamic()
- Add loading.tsx for instant perceived performance
- Use Suspense boundaries for streaming

## General
- No premature optimization — measure first, then optimize
- Profile before assuming where the bottleneck is
- Cache expensive computations and API calls
- Batch related operations when possible
