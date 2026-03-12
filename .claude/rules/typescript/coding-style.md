# TypeScript Rules (extends common/)

## Types
- Use `interface` for objects, `type` for unions/intersections
- Export types from the file that defines them
- Use Zod for runtime validation, TypeScript for compile-time
- Prefer `unknown` over `any` — narrow with type guards
- Use discriminated unions for state management

## React + Next.js
- Server Components are default — no 'use client' unless needed
- Props interfaces: `interface ComponentNameProps { ... }`
- Use `React.FC` sparingly — prefer function declarations
- Event handlers: `handle[Event]` naming (handleClick, handleSubmit)
- Custom hooks: `use[Name]` (useAuth, useProjects)

## Async
- Always `await` promises — never fire-and-forget
- Use try/catch in server actions, return typed results
- Supabase: always check `{ error }` — it doesn't throw

## Paths
- Use `@/` alias for all imports (configured in tsconfig.json)
- Group: external → @/ internal → relative → types
- Never use relative imports that go up more than one level

## Forbidden
- No `any` without documented reason
- No `@ts-ignore` without TODO
- No `as` type assertions without validation
- No `enum` — use `const` objects or union types
