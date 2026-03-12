---
name: testing-patterns
description: Testing patterns and TDD workflow. Use when writing tests, creating mocks, discussing test strategy, or when user mentions testing, TDD, or test coverage.
---

# Testing Patterns

## Test Structure
- Use `describe` blocks for grouping by feature/component
- Use `it` for individual test cases (readable as English)
- Follow AAA pattern: Arrange → Act → Assert
- One assertion concept per test (multiple expects OK if same concept)

## File Naming
- Unit tests: `ComponentName.test.tsx` (next to source file)
- Integration tests: `feature-name.integration.test.ts`
- E2E tests: `e2e/feature-name.spec.ts`

## Mocking Best Practices
- Mock at the boundary (API calls, database, external services)
- Never mock internal modules — test the real thing
- Use factory functions for test data:
  ```typescript
  function createMockUser(overrides?: Partial<User>): User {
    return { id: '1', name: 'Test', email: 'test@test.com', ...overrides };
  }
  ```

## TDD Workflow
1. Write a failing test for the expected behavior
2. Write the minimum code to make it pass
3. Refactor while keeping tests green
4. Repeat

## What to Test
- ✅ Business logic and data transformations
- ✅ Error handling and edge cases
- ✅ API contract (request/response shapes)
- ✅ User interactions (click, type, submit)
- ❌ Implementation details (internal state, private methods)
- ❌ Third-party library behavior
- ❌ CSS styling

## Coverage Goals
- Aim for 80%+ on business logic
- 100% on auth and payment flows
- Don't chase 100% overall — diminishing returns
