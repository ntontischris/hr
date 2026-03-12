# /e2e — Generate and Run E2E Tests

Create end-to-end tests for user flows with Playwright.

## Usage
```
/project:e2e [flow description]
```

Example: `/project:e2e user signup and dashboard access`

## Process
1. Identify the user flow from the description
2. Map the flow to pages and actions:
   - Which pages are visited?
   - What forms are filled?
   - What buttons are clicked?
   - What should be visible after?

3. Generate Playwright test in `tests/e2e/[flow-name].spec.ts`

4. Run the test:
   ```bash
   npx playwright test tests/e2e/[flow-name].spec.ts --headed
   ```

5. Fix any failures and re-run

## Delegate to @e2e-runner for complex multi-page flows.

## Test Structure
```typescript
test.describe('[Flow Name]', () => {
  test('happy path', async ({ page }) => { ... })
  test('error case: [description]', async ({ page }) => { ... })
})
```
