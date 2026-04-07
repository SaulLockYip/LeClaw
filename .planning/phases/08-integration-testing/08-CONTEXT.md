# Phase 8: Integration + Testing - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

End-to-end integration and verification of all phases.

**Scope:**
- `leclaw start` launches server without errors
- All CRUD operations work end-to-end
- Agent onboard flow works: LeClaw UI → onboarding prompt → agent CLI → API key returned
- SSE updates reflect in Web UI when data changes
- Basic E2E tests pass

</domain>

<decisions>
## Implementation Decisions

### E2E Test Framework
- **D-01:** Framework = **Playwright**
- **Rationale:** CLAUDE.md lists Playwright 1.59.1, browser automation for Web UI E2E

### Test Scope (Full E2E Flows)
- **D-02:** `leclaw init` flow
- **D-03:** `leclaw start` — server starts without errors
- **D-04:** Company CRUD via REST API
- **D-05:** Department CRUD via REST API
- **D-06:** Agent onboard flow:
  1. Create AgentBinding via Web UI
  2. Agent runs `leclaw agent onboard --company-id <id> --agent-id <id> --role CEO`
  3. API key returned and stored
- **D-07:** Issue CRUD via REST API + SSE updates in Web UI
- **D-08:** Approval flow: create approval → approve/reject via Web UI

### Test Files Location
- **D-09:** E2E tests: `packages/server/e2e/*.e2e.test.ts`
- **D-10:** CLI integration tests: `packages/cli/*.test.ts`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` — Phase 8 success criteria
- `.planning/REQUIREMENTS.md` — all v1 requirements
- `.planning/phases/01-foundation-cli-init/01-CONTEXT.md` — CLI commands
- `.planning/phases/02-data-layer-entity-models-db/02-CONTEXT.md` — entities
- `.planning/phases/03-openclaw-integration/03-CONTEXT.md` — agent onboard
- `.planning/phases/04-rest-api-sse/04-CONTEXT.md` — REST API + SSE
- `.planning/phases/05-web-ui-layout-dashboard/05-CONTEXT.md` — Web UI
- `.planning/phases/06-web-ui-entity-pages/06-CONTEXT.md` — entity pages
- `.planning/phases/07-harness-infrastructure/07-CONTEXT.md** — audit, comments, report

</canonical_refs>

<specifics>
## Specific Ideas

**E2E Test Example (Playwright):**
```typescript
test('agent onboard flow', async ({ page }) => {
  // 1. Create company via API
  // 2. Open Web UI
  // 3. Create agent binding
  // 4. Agent runs onboard CLI
  // 5. Verify API key returned
});
```

**Server Start Test:**
```typescript
test('leclaw start launches without errors', async () => {
  const proc = spawn('leclaw', ['start']);
  await waitForPort(8080);
  const response = await fetch('http://localhost:8080/api/companies');
  expect(response.status).toBe(200);
  proc.kill();
});
```

</specifics>

<deferred>
## Deferred Ideas

- Performance testing — v2
- Load testing — v2
- Security audit — v2

</deferred>

### Migration Strategy (CRITICAL)
- **D-11:** Use **Drizzle Kit** for schema migrations
- **D-12:** Workflow:
  - Development: `drizzle-kit generate` → auto-generate SQL from schema changes
  - Runtime: `leclaw start` auto-applies pending migrations
- **Rationale:** Matches Drizzle ORM usage; paperclip reference; embedded PG friendly

---

*Phase: 08-integration-testing*
*Context gathered: 2026-04-07*
