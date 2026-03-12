# Coding Style Rules (Always Active)

## Immutability
- Prefer const over let. Never use var.
- Create new objects instead of mutating existing ones
- Use spread operator for updates: `{ ...obj, field: newValue }`

## Functions
- Max 50 lines per function. If longer, extract.
- Max 3 parameters. If more, use an options object.
- Single responsibility: one function does one thing
- Use early returns to reduce nesting

## Files
- Max 300 lines per file. If longer, split.
- One component per file (React)
- Co-locate: tests, types, and styles next to source

## Naming
- Boolean: `isActive`, `hasPermission`, `canDelete` (prefix with is/has/can)
- Functions: verb first — `createUser`, `handleSubmit`, `validateInput`
- Components: PascalCase — `UserProfile`, `PaymentForm`
- Files: kebab-case — `user-profile.tsx`, `payment-form.tsx`

## Error Handling
- Never swallow errors silently
- Always handle the Supabase `{ error }` field
- Use typed error returns from server actions, not throw
- Log errors server-side, show friendly messages client-side

## Imports
- Group: external libs → internal modules → relative → types
- Use @/ path aliases, never relative ../../
- Destructure imports when possible
