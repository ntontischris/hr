# Testing Rules (Always Active)

## Requirements
- Every new feature MUST have tests before merge
- Target 80%+ coverage on business logic
- 100% coverage on auth and payment flows
- Tests MUST pass before committing

## TDD Workflow
- RED: Write a failing test first
- GREEN: Write minimum code to pass
- REFACTOR: Clean up while tests stay green

## What to Test
- ✅ Business logic, data transformations, validations
- ✅ API request/response contracts
- ✅ Error handling paths
- ✅ Auth/authorization flows
- ❌ CSS/styling
- ❌ Third-party library internals
- ❌ Private implementation details

## Test Quality
- Tests describe BEHAVIOR, not implementation
- Each test is independent — no shared state between tests
- Test names read as English: "should create user when valid email provided"
- Use factory functions for test data, not raw objects
