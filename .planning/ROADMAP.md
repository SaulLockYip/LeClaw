# LeClaw Roadmap

**Project:** LeClaw - OpenClaw Orchestration Center
**Granularity:** fine
**Created:** 2026-04-05
**Updated:** 2026-04-07

---

## Phases

- [x] **Phase 1: Foundation - CLI Init** - Project scaffolding, leclaw init/config, config file (completed 2026-04-07)
- [x] **Phase 2: Data Layer - Entity Models + DB** - Embedded PostgreSQL, Company/Department/Agent/Issue/Goal/Project/Approval schemas (completed 2026-04-07)
- [ ] **Phase 3: OpenClaw Integration** - openclaw.json reading, agent scanning, agent onboard, API key
- [ ] **Phase 4: REST API + SSE** - CRUD for all entities, SSE real-time updates
- [ ] **Phase 5: Web UI - Layout + Dashboard** - Company Rail, Sidebar, Dashboard with metrics
- [ ] **Phase 6: Web UI - Entity Pages** - Issues, Goals, Projects, Approvals, Departments detail
- [ ] **Phase 7: Harness Infrastructure** - Audit Log, Comments on Issues
- [ ] **Phase 8: Integration + Testing** - End-to-end testing, CLI + API integration

---

## Phase Details

### Phase 1: Foundation - CLI Init

**Goal:** User can initialize LeClaw project and configure settings via CLI

**Depends on:** Nothing (first phase)

**Success Criteria:**
1. `leclaw init` runs interactively and creates `~/.leclaw/` directory
2. `leclaw config` shows current configuration
3. `leclaw config set <key> <value>` updates config
4. Config structure matches SPEC: openclaw.dir, openclaw.gatewayUrl, server.port

---

### Phase 2: Data Layer - Entity Models + DB

**Goal:** All core entities persist correctly in embedded PostgreSQL with Drizzle ORM

**Depends on:** Phase 1

**Success Criteria:**
1. Company entity: id, name, description, createdAt, updatedAt
2. Department entity: id, name, companyId, description, createdAt, updatedAt
3. Agent entity: id, name, role, openClawAgentId, openClawAgentWorkspace, openClawAgentDir, companyId, departmentId
4. Issue entity: id, title, description, status, assignee, departmentId, subIssues, comments, report, projectId, goalId
5. Goal entity: id, title, description, status, verification, deadline, departmentIds, issueIds
6. Project entity: id, companyId, title, description, status, projectDir, issueIds
7. Approval entity: id, title, description, requester, status, rejectMessage

---

### Phase 3: OpenClaw Integration

**Goal:** LeClaw discovers OpenClaw agents and supports agent onboarding

**Depends on:** Phase 2

**Success Criteria:**
1. LeClaw reads `#{openclaw.dir}/openclaw.json` to discover agents
2. `openclaw agents list` command shows available agents
3. `leclaw agent onboard --company-id <id> --agent-id <id> --role <role> [--department-id <id>]` works
4. API key is generated and returned to agent after successful onboard
5. Agent binding is stored in database

---

### Phase 4: REST API + SSE

**Goal:** All entities exposed via REST API; SSE for real-time Web UI updates

**Depends on:** Phase 3

**Success Criteria:**
1. CRUD endpoints for: Companies, Departments, Agents, Issues, Goals, Projects, Approvals
2. REST API path structure: `/api/companies`, `/api/companies/:id/departments`, etc.
3. SSE endpoint for real-time updates (Web UI only)
4. SSE includes heartbeat comments to prevent timeout
5. SSE events follow consistent schema

---

### Phase 5: Web UI - Layout + Dashboard

**Goal:** Basic layout with Company Rail, Sidebar, and Dashboard metrics

**Depends on:** Phase 4

**Success Criteria:**
1. Company Rail on left side with company avatars
2. Sidebar with navigation: Dashboard, Issues, Goals, Projects, Approvals, Departments
3. Dashboard shows: Companies count, Agents Online, Open Issues, Total Agents
4. Dashboard shows: Agent Status table, Recent Issues list
5. Navigation between pages works

---

### Phase 6: Web UI - Entity Pages

**Goal:** Full pages for all entities with list and detail views

**Depends on:** Phase 5

**Success Criteria:**
1. **Issues Page:** List with filters (All/Open/In Progress/Done), detail view with sub-issues and comments
2. **Goals Page:** List with filters, detail showing related issues
3. **Projects Page:** List with projectDir, detail view
4. **Approvals Page:** List with approve/reject actions
5. **Departments Page:** Department detail with Manager and Staff lists

---

### Phase 7: Harness Infrastructure

**Goal:** Audit logging and agent interaction mechanisms

**Depends on:** Phase 6

**Success Criteria:**
1. Audit Log: records every CLI/API operation (agentId, command, args, result, timestamp)
2. Comments on Issues: human read-only, agent can write
3. Issue report field: Markdown, can be updated with separator for updates

---

### Phase 8: Integration + Testing

**Goal:** End-to-end integration and verification

**Depends on:** Phase 7

**Success Criteria:**
1. `leclaw start` launches server without errors
2. All CRUD operations work end-to-end
3. Agent onboard flow works: LeClaw UI → onboarding prompt → agent CLI → API key returned
4. SSE updates reflect in Web UI when data changes
5. Basic E2E tests pass

---

## Progress Table

| Phase | Status | Completed |
|-------|--------|-----------|
| 1. Foundation - CLI Init | Completed | 2026-04-07 |
| 2. Data Layer - Entity Models + DB | Completed | 2026-04-07 |
| 3. OpenClaw Integration | Not started | - |
| 4. REST API + SSE | Not started | - |
| 5. Web UI - Layout + Dashboard | Not started | - |
| 6. Web UI - Entity Pages | Not started | - |
| 7. Harness Infrastructure | Not started | - |
| 8. Integration + Testing | Not started | - |

---

*Generated: 2026-04-05*
*Updated: 2026-04-07*
