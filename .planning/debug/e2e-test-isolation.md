---
status: resolved
trigger: "E2E tests have isolation issues - items created in beforeEach are not persisting to subsequent tests"
created: 2026-04-08T23:53:00Z
updated: 2026-04-09T00:45:00Z
---

## Current Focus

**RESOLVED**: All 30 E2E tests now pass.

## Root Cause Summary

**PRIMARY BUG - Test Design Issue**: The original tests used `beforeEach` to create a company, then relied on `departmentId`/`agentId`/`issueId` being set in the FIRST test for subsequent tests. But `beforeEach` runs BEFORE EACH test, creating a new company each time and overwriting the shared `companyId` variable.

**Debug evidence:**
```
[beforeEach] companyId = f615feec-...  (OLD company)
[create department] departmentId = 98a8bc87...

[beforeEach] companyId = d82de7b1-...  (NEW company - beforeEach ran again!)
[list] companyId = d82de7b1-...       (NEW company)
[list] departmentId = 98a8bc87...     (OLD department from previous test!)
[list] response = {"success":true,"data":[]}  (NEW company has no departments!)
```

**SECONDARY BUG - SSE Tests**: SSE is a persistent connection that never "completes". Playwright's `page.request.get()` waits for response completion, causing timeouts. Fixed by using HEAD requests and curl for header verification.

## Files Changed

- `packages/server/e2e/department-crud.e2e.test.ts` - Each test now creates its own company and department
- `packages/server/e2e/agent-crud.e2e.test.ts` - Each test now creates its own company and agent
- `packages/server/e2e/company-crud.e2e.test.ts` - Each test now creates its own company (and calls `status()` as method not property)
- `packages/server/e2e/issue-crud.e2e.test.ts` - Each test now creates its own company, department, and issue
- `packages/server/e2e/sse-updates.e2e.test.ts` - Uses HEAD requests and curl to test SSE without waiting for stream completion

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: "Data created in beforeEach (company) should be available in test, and data created in first test (department) should persist to subsequent tests within the same describe block"
actual: "Tests like 'list departments for company' fail because the department created in 'create department' test is not visible"
errors: "Various - list returns empty, get returns 404, etc."
reproduction: "Run `pnpm --filter @leclaw/server test:e2e` and observe failures"
started: "Unknown - likely recent"

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: "Playwright runs tests in parallel, causing data isolation issues"
  evidence: "Ran with --workers=1 and still fails. Tests run sequentially within a describe block."
  timestamp: 2026-04-09T00:30:00Z

- hypothesis: "API has a bug with data persistence"
  evidence: "Manual curl testing and single-test Playwright test both show API works correctly"
  timestamp: 2026-04-09T00:35:00Z

- hypothesis: "beforeEach data is not persisting to subsequent tests"
  evidence: "beforeEach DOES run, but it creates NEW data each time, overwriting shared variables like companyId"
  timestamp: 2026-04-09T00:40:00Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-04-08T23:53:00Z
  checked: "Test files structure and Playwright config"
  found: "Playwright runs tests in parallel by default (workers setting)"
  implication: "beforeEach runs before EACH test in parallel, but subsequent tests expecting data from earlier tests won't have it"

- timestamp: 2026-04-09T00:30:00Z
  checked: "Ran tests with single worker (--workers=1)"
  found: "Still fails with same errors - tests run sequentially within a describe block"
  implication: "The issue is NOT parallelization - tests are running in order"

- timestamp: 2026-04-09T00:35:00Z
  checked: "Manual API testing with curl"
  found: "API works correctly - companies and departments are created and retrieved properly"
  implication: "The issue is in the TEST LOGIC, not the API"

- timestamp: 2026-04-09T00:35:00Z
  checked: "Single test that runs all operations in sequence"
  found: "Test passes when all steps run within a single test"
  implication: "Data persistence works - the issue is test structure"

- timestamp: 2026-04-09T00:40:00Z
  checked: "Debug test mimicking beforeEach + separate tests structure"
  found: "beforeEach runs before EACH test and creates a new company, overwriting companyId. departmentId retains old value."
  implication: "CONFIRMED ROOT CAUSE: beforeEach creates new company each time, but subsequent tests use departmentId from previous test's scope"

- timestamp: 2026-04-09T00:45:00Z
  checked: "All E2E tests after fix"
  found: "30/30 tests pass"
  implication: "Fix verified - each test creates its own complete setup"

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: "The beforeEach hook runs before EACH test and creates a new company, which overwrites the shared `companyId` variable. But `departmentId`/`agentId`/`issueId` are only set in the first test and persist. Subsequent tests use the NEW company's ID but the OLD entity's ID, causing mismatches."

fix: "Restructure tests to be fully independent. Each test creates its own company AND any entities it needs (departments, agents, issues). Do not use beforeEach to create shared state that subsequent tests depend on. Also fixed: Playwright's APIResponse.status() is a method, not a property."

verification: "All 30 E2E tests pass"
files_changed: ["packages/server/e2e/department-crud.e2e.test.ts", "packages/server/e2e/agent-crud.e2e.test.ts", "packages/server/e2e/company-crud.e2e.test.ts", "packages/server/e2e/issue-crud.e2e.test.ts", "packages/server/e2e/sse-updates.e2e.test.ts"]
