# Phase 2: Data Layer - Entity Models + DB - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

All core entities persist correctly in embedded PostgreSQL with Drizzle ORM.

**Scope:**
- Company entity: id, name, description, createdAt, updatedAt
- Department entity: id, name, companyId, description, createdAt, updatedAt
- Agent entity: id, name, role, openClawAgentId, openClawAgentWorkspace, openClawAgentDir, companyId, departmentId, createdAt, updatedAt
- Issue entity: id, title, description, status, assignee, departmentId, subIssues, comments, report, projectId, goalId, createdAt, updatedAt
- Goal entity: id, title, description, status, verification, deadline, departmentIds, issueIds, createdAt, updatedAt
- Project entity: id, companyId, title, description, status, projectDir, issueIds, createdAt, updatedAt
- Approval entity: id, title, description, requester, status, rejectMessage, createdAt, updatedAt
- Comment entity: id, issueId, author, timestamp, message
- embedded PostgreSQL initialization via `leclaw init` or first `leclaw start`

**Out of scope for this phase:**
- REST API endpoints (Phase 4)
- OpenClaw agent integration (Phase 3)
- Web UI (Phase 5+)

</domain>

<decisions>
## Implementation Decisions

### ID Generation
- **D-01:** Entity ID = **UUID v4** via `uuid("id").primaryKey().defaultRandom()`
- **Rationale:** Simple, PostgreSQL built-in, paperclip reference pattern

### Type System
- **D-02:** Status and Role fields = **text** (not PostgreSQL enum)
- **D-03:** Rationale: LeClaw is internal tool, flexibility over type safety; no need for enum migration overhead

### Schema Patterns (from paperclip reference)
- **D-04:** Timestamps: `timestamp("created_at", { withTimezone: true }).notNull().defaultNow()`
- **D-05:** Index naming: `#{table}_{columns}_idx` (e.g., `companies_status_idx`)

### Array/Relation Storage
- **D-06:** Issue.subIssues = **JSONB array** (`uuid[]`)
- **D-07:** Goal.departmentIds = **JSONB array** (`uuid[]`)
- **D-08:** Goal.issueIds = **JSONB array** (`uuid[]`)
- **D-09:** Project.issueIds = **JSONB array** (`uuid[]`)
- **D-10:** Issue.comments = **separate table** (`issue_comments`)
- **D-11:** Issue.report = **text** (Markdown content)
- **Rationale:** Internal tool — JSONB for convenience, separate table for comments (human-read-only, agent-write, likely to grow)

### Department Model (Confirmed)
- **D-12:** Department fields: id, name, companyId, description, createdAt, updatedAt
- **D-13:** Manager Agent linkage via `Agent.departmentId` (not a field on Department)
- **Rationale:** Keep Department simple; agents carry the department reference

### Indexes
- **D-14:** Required: `companyId` as first column in all compound indexes (isolation boundary)
- **D-15:** Per-entity indexes:
  - `companies`: id (PK only)
  - `departments`: `(companyId)` — company isolation
  - `agents`: `(companyId, departmentId)`, `(companyId, role)`
  - `issues`: `(companyId, status)`, `(companyId, assigneeAgentId, status)`, `(departmentId, status)`
  - `goals`: `(companyId, status)`
  - `projects`: `(companyId, status)`
  - `approvals`: `(companyId, status)`, `(requester, status)`

### Timestamps
- **D-16:** All entities have `createdAt` and `updatedAt` (standard audit fields)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/SPEC.md` — Entity models (Company, Department, Agent, Issue, Goal, Project, Approval, Comment)
- `.planning/ROADMAP.md` — Phase 2 success criteria
- `.planning/REQUIREMENTS.md` — DATA-01 to DATA-05, API-01 to API-05
- `.planning/phases/01-foundation-cli-init/01-CONTEXT.md` — Phase 1 decisions (TypeScript standard mode, pnpm, monorepo structure)
- `referenceRepo/paperclip/packages/db/src/schema/` — Reference schema patterns (companies.ts, agents.ts, issues.ts, goals.ts, projects.ts, approvals.ts)
- `referenceRepo/paperclip/packages/db/drizzle.config.ts` — Drizzle config pattern

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- paperclip `drizzle.config.ts` pattern for schema → migration setup
- paperclip schema files with full entity definitions (agents.ts, companies.ts, issues.ts)
- `pgTable`, `uuid`, `text`, `timestamp`, `jsonb`, `index` from `drizzle-orm/pg-core`

### Established Patterns
- UUID primary keys with `defaultRandom()`
- Timestamps with `withTimezone: true` and `defaultNow()`
- Compound indexes with `companyId` as first column
- JSONB for flexible array fields

### Integration Points
- `packages/server/` will host the Drizzle schema
- `packages/shared/` will export entity types (used by both CLI and server)
- embedded PostgreSQL connection from Phase 1 (`~/.leclaw/db/`)

</codebase_context>

<specifics>
## Specific Ideas

**Entity Field Summary:**

```
Company { id, name, description?, createdAt, updatedAt }

Department { id, name, companyId, description?, createdAt, updatedAt }

Agent { id, name, role: "CEO"|"Manager"|"Staff", openClawAgentId, openClawAgentWorkspace, openClawAgentDir, companyId, departmentId?, createdAt, updatedAt }

Issue {
  id, title, description?, status: "Open"|"InProgress"|"Blocked"|"Done"|"Cancelled",
  assigneeAgentId?, departmentId,
  subIssues: uuid[],
  report?, // Markdown text
  projectId?, goalId?,
  createdAt, updatedAt
}

IssueComment { id, issueId, author: agentId, timestamp, message }

Goal {
  id, title, description?, status: "Open"|"Achieved"|"Archived",
  verification?, deadline?,
  departmentIds: uuid[], issueIds: uuid[],
  createdAt, updatedAt
}

Project {
  id, companyId, title, description?, status: "Open"|"InProgress"|"Done"|"Archived",
  projectDir?, issueIds: uuid[],
  createdAt, updatedAt
}

Approval {
  id, title, description?, requester: agentId,
  status: "Pending"|"Approved"|"Rejected",
  rejectMessage?, createdAt, updatedAt
}
```

**Migration Strategy:**
- Use Drizzle Kit for migration generation
- Migrations stored in `packages/server/src/migrations/`

</specifics>

<deferred>
## Deferred Ideas

- JSONB vs separate table for flexible fields — decided JSONB for arrays, separate table for comments only
- PostgreSQL enum vs text — decided text for flexibility

</deferred>

---

*Phase: 02-data-layer-entity-models-db*
*Context gathered: 2026-04-07*
