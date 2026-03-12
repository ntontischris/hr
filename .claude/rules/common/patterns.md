# Design Patterns Rules (Always Active)

## Composition Over Inheritance
- Use composition and hooks, not class inheritance
- Small, focused components that compose together
- Shared behavior via custom hooks or utility functions

## Single Source of Truth
- Database is the source of truth for data
- URL is the source of truth for page state
- React state only for ephemeral UI state (modals, tooltips)
- Never duplicate state — derive it

## Fail Fast
- Validate inputs at the boundary (API entry, form submission)
- Return early on errors — don't let invalid data propagate
- Use Zod at API boundaries, TypeScript types everywhere else

## Explicit Over Implicit
- Prefer named exports over default exports
- Explicit error handling over implicit throws
- Explicit dependencies over global state
- Explicit props over context (unless widely shared)

## YAGNI (You Aren't Gonna Need It)
- Don't build abstractions before you have 3 use cases
- Don't add "flexibility" that nobody asked for
- Simple, direct code > clever, extensible code
- Refactor WHEN needed, not BEFORE
