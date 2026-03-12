# /tdd — Test-Driven Development

Implement a feature using strict TDD: test first, then code.

## Usage
```
/project:tdd [feature description]
```

## Process

### Phase 1: Design Tests
1. Read the feature description
2. List the behaviors to test (happy path + edge cases)
3. Write ALL test cases as empty `it()` blocks first
4. Get user approval on test plan

### Phase 2: RED → GREEN → REFACTOR (per test)
For each test case:
1. **RED**: Fill in the test assertions → run → see it FAIL
2. **GREEN**: Write MINIMUM code to pass → run → see it PASS
3. **REFACTOR**: Clean up code → run → tests still PASS

### Phase 3: Integration
1. Run full test suite: `pnpm test`
2. Run build: `pnpm build`
3. Report coverage for the new code

## Delegate to @tdd-guide for guidance on testing strategy.

## Rules
- NEVER skip the failing test step
- NEVER write implementation before the test
- Each cycle should be small (5-10 min)
