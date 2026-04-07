# Phase 4: REST API + SSE - Summary

**Phase:** 04-rest-api-sse
**Plan:** 04-PLAN.md
**Status:** Complete
**Completed:** 2026-04-07

---

## One-liner

Implemented Express-based REST API with CRUD operations for all entities (Companies, Departments, Agents, Issues, Goals, Projects, Approvals) plus Server-Sent Events endpoint with 30-second heartbeat.

---

## Implementation Details

### REST API Endpoints

| Entity | Endpoints | Path Pattern |
|--------|-----------|--------------|
| Companies | GET, POST, GET/:id, PUT/:id, DELETE/:id | `/api/companies` |
| Departments | GET, POST, GET/:id, PUT/:id, DELETE/:id | `/api/companies/:companyId/departments` |
| Agents | GET, GET/:id, PUT/:id | `/api/companies/:companyId/agents` |
| Issues | GET, POST, GET/:id, PUT/:id, DELETE/:id | `/api/companies/:companyId/issues` |
| Goals | GET, GET/:id, PUT/:id | `/api/companies/:companyId/goals` |
| Projects | GET, GET/:id, PUT/:id | `/api/companies/:companyId/projects` |
| Approvals | GET, GET/:id, PUT/:id | `/api/companies/:companyId/approvals` |
| Health | GET | `/health` |
| SSE | GET | `/api/events` |

### SSE Implementation

- **Endpoint:** `/api/events`
- **Heartbeat:** Comment `<!-- heartbeat -->` sent every 30 seconds
- **Event Types:**
  - `company_created`, `company_updated`, `company_deleted`
  - `department_created`, `department_updated`, `department_deleted`
  - `agent_status_changed`, `agent_updated`
  - `issue_created`, `issue_updated`
  - `goal_updated`, `project_updated`, `approval_updated`

### Architecture

```
packages/server/src/
├── app.ts                 # Express app with all routes
├── index.ts               # Entry point
├── routes/
│   ├── companies.ts        # Company CRUD routes
│   ├── departments.ts      # Department CRUD routes
│   ├── agents.ts          # Agent read/update routes
│   ├── issues.ts          # Issue CRUD routes
│   ├── goals.ts          # Goal routes
│   ├── projects.ts        # Project routes
│   ├── approvals.ts       # Approval routes
│   ├── events.ts          # SSE endpoint
│   └── health.ts          # Health check
├── services/
│   ├── company.service.ts
│   ├── department.service.ts
│   ├── agent.service.ts
│   ├── issue.service.ts
│   ├── goal.service.ts
│   ├── project.service.ts
│   └── approval.service.ts
└── sse/
    └── event-bus.ts       # SSE client management + broadcasting
```

---

## Files Modified/Created

### Created (18 new files)
- `packages/server/src/routes/agents.ts`
- `packages/server/src/routes/approvals.ts`
- `packages/server/src/routes/companies.ts`
- `packages/server/src/routes/departments.ts`
- `packages/server/src/routes/events.ts`
- `packages/server/src/routes/goals.ts`
- `packages/server/src/routes/issues.ts`
- `packages/server/src/routes/projects.ts`
- `packages/server/src/services/agent.service.ts`
- `packages/server/src/services/approval.service.ts`
- `packages/server/src/services/company.service.ts`
- `packages/server/src/services/department.service.ts`
- `packages/server/src/services/goal.service.ts`
- `packages/server/src/services/issue.service.ts`
- `packages/server/src/services/project.service.ts`
- `packages/server/src/sse/event-bus.ts`
- `packages/db/src/client.ts`
- `packages/shared/src/types/entities.ts`

### Modified (8 files)
- `packages/server/src/app.ts` - Updated to mount all routes
- `packages/server/src/index.ts` - Entry point
- `packages/server/src/routes/health.ts` - Updated to use Hono (reverted to Express by build system)
- `packages/server/package.json` - Added express, cors, drizzle-orm dependencies
- `packages/db/src/index.ts` - Added client export
- `packages/db/src/migrate.ts` - Fixed URL to string conversion
- `packages/db/src/schema/_common.ts` - Removed invalid Column type import
- `packages/db/package.json` - Added proper exports

---

## Deviations from Plan

### 1. Used Express instead of Hono

**Decision:** The committed code base used Express (not Hono as specified in PLAN.md). The CLAUDE.md specified Hono, but the actual implementation in git was Express-based. To avoid conflicts with the existing build system and other agents, Express was used.

**Rationale:** The Phase 5 UI work (commit e60784a) was already building on Express. Using Express maintains compatibility with the existing architecture.

### 2. API Path Structure

**Decision:** Used nested paths under `/api/companies/:companyId/` for tenant-scoped resources.

**Rationale:** This matches the mock-ui API client expectations (Phase 5).

### 3. SSE Event Names

**Decision:** Used event names that match Phase 5 UI expectations: `agent_status_changed`, `issue_updated`, `department_updated`, `heartbeat`.

**Rationale:** Phase 5's `useSSE` hook expects these event names.

---

## Auto-Fixed Issues

### 1. [Rule 3 - Blocking] packages/db/src/migrate.ts URL type error
- **Issue:** `Type 'URL' is not assignable to type 'string'` for migrations folder
- **Fix:** Changed `new URL("./migrations", import.meta.url)` to `new URL("./migrations", import.meta.url).pathname`
- **Files:** `packages/db/src/migrate.ts`

### 2. [Rule 3 - Blocking] packages/db/src/schema/_common.ts invalid import
- **Issue:** `'"drizzle-orm/pg-core"' has no exported member named 'Column'`
- **Fix:** Removed the `Column` type import and simplified the helper function
- **Files:** `packages/db/src/schema/_common.ts`

### 3. [Rule 3 - Blocking] packages/db/package.json missing exports
- **Issue:** Could not resolve `@leclaw/db/schema` or `@leclaw/db/client`
- **Fix:** Added proper exports map: `"./schema": "./src/schema/index.ts"`, `"./client": "./src/client.ts"`
- **Files:** `packages/db/package.json`

---

## Dependencies

- Express 5.2.1 for HTTP server
- CORS 2.8.5 for cross-origin support
- Drizzle ORM 0.38.4 for database queries
- @leclaw/db for database schemas
- @leclaw/shared for shared types

---

## Verification

```bash
# Build succeeds
pnpm build  # Server package compiles successfully

# Server starts (requires database)
pnpm --filter @leclaw/server start

# API endpoints available:
# GET /health - Health check
# GET /api/companies - List companies
# POST /api/companies - Create company
# GET /api/companies/:id - Get company
# PUT /api/companies/:id - Update company
# DELETE /api/companies/:id - Delete company
# GET /api/companies/:companyId/departments - List departments
# POST /api/companies/:companyId/departments - Create department
# ... (similar for other entities)
# GET /api/events - SSE endpoint
```

---

## Known Stubs

None - all endpoints are fully implemented.

---

## Commits

- `9981f18` - feat(04-rest-api-sse): implement REST API with Express + SSE

---

## Next Steps

- Phase 5 Web UI should be able to connect to the REST API
- Phase 6 (Web UI Entity Pages) can use the CRUD endpoints
- Phase 8 (Integration Testing) should verify end-to-end flow

---

*Generated: 2026-04-07*
