# Phase 4: REST API + SSE - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

All entities exposed via REST API; SSE for real-time Web UI updates.

**Scope:**
- CRUD endpoints for: Companies, Departments, Agents, Issues, Goals, Projects, Approvals
- REST API path structure: `/api/companies`, `/api/companies/:id/departments`, etc.
- SSE endpoint for real-time updates (Web UI only)
- SSE includes heartbeat comments to prevent timeout
- SSE events follow consistent schema

**Out of scope for this phase:**
- Web UI pages (Phase 5+)

</domain>

<decisions>
## Implementation Decisions

### REST Framework
- **D-01:** Framework = **Hono** (not Express)
- **Rationale:** Lightweight, fast, TypeScript-first, modern Node.js compatible

### API Auth
- **D-02:** **No authentication** on REST API
- **Rationale:** Local open-source framework, no multi-tenant isolation, Web UI directly calls API
- **D-03:** CLI layer handles API Key validation for agent identity
- **D-04:** Agent CLI usage: `leclaw <command> --api-key <key>` (internal validation, not HTTP)

### REST API Paths
- **D-05:** Path structure:
  - `/api/companies` — list, create
  - `/api/companies/:id` — get, update, delete
  - `/api/companies/:companyId/departments` — list, create
  - `/api/companies/:companyId/departments/:id` — get, update, delete
  - `/api/agents` — list, get
  - `/api/agents/:id` — get, update
  - `/api/issues` — list, create
  - `/api/issues/:id` — get, update, delete
  - `/api/goals` — list, create
  - `/api/goals/:id` — get, update, delete
  - `/api/projects` — list, create
  - `/api/projects/:id` — get, update, delete
  - `/api/approvals` — list, create
  - `/api/approvals/:id` — get, update

### Error Format
- **D-06:** Standard error response:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Human readable message",
    "details": {}
  }
}
```

### SSE Endpoint
- **D-07:** SSE endpoint: `/api/events`
- **D-08:** SSE **heartbeat**: `<!-- heartbeat -->` comment every **30 seconds**
- **Rationale:** Prevent load balancer timeout, keep connection alive

### SSE Event Schema
- **D-09:** SSE event format:
```
event: <event_type>
data: <json_payload>

event_type values: company_created, company_updated, company_deleted,
                   department_created, department_updated, department_deleted,
                   agent_updated, issue_created, issue_updated,
                   goal_updated, project_updated, approval_updated
```

### Company Isolation
- **D-10:** No auth, but **companyId filter** required on all requests
- **Rationale:** Single-user local tool — isolation is by design choice, not enforcement

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/SPEC.md` — Architecture, REST API paths, SSE design
- `.planning/ROADMAP.md` — Phase 4 success criteria
- `.planning/REQUIREMENTS.md` — API-01 to API-05, RT-01 to RT-03
- `.planning/phases/01-foundation-cli-init/01-CONTEXT.md` — Phase 1 decisions (server port, structure)
- `.planning/phases/02-data-layer-entity-models-db/02-CONTEXT.md` — Phase 2 entity schemas
- `.planning/phases/03-openclaw-integration/03-CONTEXT.md` — Phase 3 API key format

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Hono Usage
- Already in project dependencies (CLAUDE.md: Hono 4.12.10)
- Type-safe routing built-in
- Works well with middleware pattern

### Integration Points
- `packages/server/` — hosts Hono app, SSE endpoint
- `packages/web/` — SSE client, subscribes to events
- `packages/cli/` — passes API key to commands (internal, not HTTP)

</codebase_context>

<specifics>
## Specific Ideas

**SSE Client (Web UI):**
- EventSource API to connect to `/api/events`
- Reconnect on drop (RT-03 requirement)
- Update local state on events

**Heartbeat Implementation:**
```typescript
// Server-side
setInterval(() => {
  ctx.res.write('<!-- heartbeat -->\n');
}, 30000);
```

**No Auth Middleware:**
- No Authorization header check
- companyId passed as query param or request body
- Example: `GET /api/companies?companyId=xxx`

</specifics>

<deferred>
## Deferred Ideas

- External system integration via REST API — no real external systems planned for v1
- Auth for SSE endpoint — not needed (Web UI is local)

</deferred>

---

*Phase: 04-rest-api-sse*
*Context gathered: 2026-04-07*
