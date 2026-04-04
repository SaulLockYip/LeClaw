# LeClaw Roadmap

**Project:** LeClaw - Agent Management Platform
**Granularity:** fine (8-12 phases)
**Total v1 Requirements:** 35
**Created:** 2026-04-05

---

## Phases

- [ ] **Phase 1: Foundation + CLI Init** - Project scaffolding, shared types, CLI init/config commands
- [ ] **Phase 2: Data Layer + API Foundation** - Embedded PostgreSQL, Company/Department CRUD, REST API foundations
- [ ] **Phase 3: OpenClaw Bridge + API** - OpenClaw Gateway connection, agent scanning/heartbeat, Issue/Agent REST API
- [ ] **Phase 4: Real-Time Infrastructure** - SSE endpoint, heartbeat, client reconnection
- [ ] **Phase 5: Web UI - Dashboard** - Company overview, real-time agent status, recent issues
- [ ] **Phase 6: Web UI - Organization** - Company/Department/Agent management, binding/unbinding
- [ ] **Phase 7: Web UI - Issues** - Issue creation, listing, status updates, external REST API
- [ ] **Phase 8: Integration + E2E Testing** - End-to-end integration, verification of all workflows

---

## Phase Details

### Phase 1: Foundation + CLI Init

**Goal:** User can initialize LeClaw project and configure OpenClaw/Gateway settings via CLI

**Depends on:** Nothing (first phase)

**Requirements:** CLI-01, CLI-02, CLI-03, DATA-01

**Success Criteria** (what must be TRUE):
1. User can run `leclaw init` and configuration directory `~/.leclaw/` is created
2. User can run `leclaw config openclaw --dir <path>` and directory is stored in config
3. User can run `leclaw config gateway --url <url> --key <key>` and gateway settings are stored
4. User can verify config with `leclaw config` and see all configured values
5. On first run, LeClaw initializes embedded PostgreSQL database automatically

**Plans**: TBD

---

### Phase 2: Data Layer + API Foundation

**Goal:** All core entities persist correctly and REST API exposes Company/Department CRUD

**Depends on:** Phase 1

**Requirements:** DATA-02, DATA-03, DATA-04, DATA-05, API-01, API-02, API-03, API-04, API-05

**Success Criteria** (what must be TRUE):
1. Company entity can be created via API and persisted to database
2. Company entity can be retrieved, updated, and deleted via API
3. Department entity can be created under a Company and persists correctly
4. Agent binding relationship (CEO/Manager/Staff role to OpenClaw agent ID) is stored and retrieved
5. Issue entity with title, description, status, and assignee is stored and listed via API
6. API returns proper error responses with codes for invalid requests
7. Database schema supports multi-Company data isolation

**Plans**: TBD

---

### Phase 3: OpenClaw Bridge + API

**Goal:** LeClaw connects to OpenClaw Gateway and surfaces agent status; Issue and Agent APIs are complete

**Depends on:** Phase 2

**Requirements:** OPENCLAW-01, OPENCLAW-02, OPENCLAW-03, OPENCLAW-04

**Success Criteria** (what must be TRUE):
1. LeClaw scans configured OpenClaw directory and discovers all available agents
2. LeClaw polls OpenClaw Gateway for agent status at configurable intervals
3. LeClaw maintains heartbeat with OpenClaw agents and verifies liveness
4. Agent status changes emit SSE events to connected Web UI clients
5. REST API exposes OpenClaw agent list with current status
6. REST API exposes Issue CRUD with proper status transitions

**Plans**: TBD

---

### Phase 4: Real-Time Infrastructure

**Goal:** Web UI receives real-time updates via SSE with reliable connection management

**Depends on:** Phase 3

**Requirements:** RT-01, RT-02, RT-03

**Success Criteria** (what must be TRUE):
1. Web UI connects to SSE endpoint and receives agent status change events
2. SSE connections include heartbeat comments every 15-30 seconds to prevent timeout
3. After SSE connection drop, Web UI reconnects automatically using Last-Event-ID
4. Server cleans up SSE connections when clients disconnect
5. SSE events follow consistent schema across all event types

**Plans**: TBD

---

### Phase 5: Web UI - Dashboard

**Goal:** Users see overview of all Companies, real-time agent status, and recent activity

**Depends on:** Phase 4

**Requirements:** UI-01, UI-02, UI-03

**Success Criteria** (what must be TRUE):
1. Dashboard displays summary cards showing total Companies and Department counts
2. Dashboard displays real-time status indicators (online/offline/busy) for all detected OpenClaw agents
3. Dashboard shows list of recent Issues with their current states
4. Dashboard updates automatically when agent status changes via SSE
5. Dashboard updates automatically when new Issues are created

**Plans**: TBD
**UI hint**: yes

---

### Phase 6: Web UI - Organization

**Goal:** Users can manage Companies, Departments, and assign OpenClaw agents to roles

**Depends on:** Phase 5

**Requirements:** UI-04, UI-05, UI-06, UI-07, UI-08, UI-09

**Success Criteria** (what must be TRUE):
1. User can view paginated list of all Companies and click to view a specific Company
2. User can view Company detail page showing CEO agent assignment
3. User can view list of Departments under a Company and create new Departments
4. User can assign a Manager agent to a Department by selecting from available OpenClaw agents
5. User can assign one or more Staff agents to a Department by selecting from available OpenClaw agents
6. User can reassign any bound agent to a different role or unbind them completely
7. Agent availability reflects current connection status from OpenClaw

**Plans**: TBD
**UI hint**: yes

---

### Phase 7: Web UI - Issues

**Goal:** Users can create, view, and manage Issues; external systems can create Issues via REST API

**Depends on:** Phase 5

**Requirements:** ISSUE-01, ISSUE-02, ISSUE-03, ISSUE-04

**Success Criteria** (what must be TRUE):
1. User can create an Issue from Web UI with title, description, and target Department selection
2. User can view list of all Issues with filter controls for Company and Department
3. User can click an Issue to view its detail and change status (open, in-progress, done)
4. External systems can POST to `/api/issues` with API key authentication to create Issues
5. Issue list updates in real-time when Issues are created or status changes

**Plans**: TBD
**UI hint**: yes

---

### Phase 8: Integration + E2E Testing

**Goal:** All components work together end-to-end; critical user workflows are verified

**Depends on:** Phase 7

**Requirements:** (Cross-phase integration requirements)

**Success Criteria** (what must be TRUE):
1. `leclaw start` launches both backend server and Web UI without errors
2. CLI status command accurately reflects connection state to OpenClaw and Gateway
3. Creating a Company via Web UI persists correctly and appears in Dashboard
4. Assigning OpenClaw agents to Company/Department roles persists and displays in UI
5. Creating an Issue via Web UI and via REST API both appear in Issues list
6. Agent status changes in OpenClaw reflect in Web UI within one polling interval
7. SSE connection remains stable across multiple agent status changes
8. All REST API endpoints return correct error codes for edge cases

**Plans**: TBD

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + CLI Init | 0/5 | Not started | - |
| 2. Data Layer + API Foundation | 0/7 | Not started | - |
| 3. OpenClaw Bridge + API | 0/6 | Not started | - |
| 4. Real-Time Infrastructure | 0/5 | Not started | - |
| 5. Web UI - Dashboard | 0/5 | Not started | - |
| 6. Web UI - Organization | 0/7 | Not started | - |
| 7. Web UI - Issues | 0/5 | Not started | - |
| 8. Integration + E2E Testing | 0/8 | Not started | - |

---

## Requirement Coverage Map

| Requirement | Phase | Phase Name |
|-------------|-------|------------|
| CLI-01 | 1 | Foundation + CLI Init |
| CLI-02 | 1 | Foundation + CLI Init |
| CLI-03 | 1 | Foundation + CLI Init |
| DATA-01 | 1 | Foundation + CLI Init |
| DATA-02 | 2 | Data Layer + API Foundation |
| DATA-03 | 2 | Data Layer + API Foundation |
| DATA-04 | 2 | Data Layer + API Foundation |
| DATA-05 | 2 | Data Layer + API Foundation |
| API-01 | 2 | Data Layer + API Foundation |
| API-02 | 2 | Data Layer + API Foundation |
| API-03 | 2 | Data Layer + API Foundation |
| API-04 | 2 | Data Layer + API Foundation |
| API-05 | 2 | Data Layer + API Foundation |
| OPENCLAW-01 | 3 | OpenClaw Bridge + API |
| OPENCLAW-02 | 3 | OpenClaw Bridge + API |
| OPENCLAW-03 | 3 | OpenClaw Bridge + API |
| OPENCLAW-04 | 3 | OpenClaw Bridge + API |
| RT-01 | 4 | Real-Time Infrastructure |
| RT-02 | 4 | Real-Time Infrastructure |
| RT-03 | 4 | Real-Time Infrastructure |
| UI-01 | 5 | Web UI - Dashboard |
| UI-02 | 5 | Web UI - Dashboard |
| UI-03 | 5 | Web UI - Dashboard |
| UI-04 | 6 | Web UI - Organization |
| UI-05 | 6 | Web UI - Organization |
| UI-06 | 6 | Web UI - Organization |
| UI-07 | 6 | Web UI - Organization |
| UI-08 | 6 | Web UI - Organization |
| UI-09 | 6 | Web UI - Organization |
| ISSUE-01 | 7 | Web UI - Issues |
| ISSUE-02 | 7 | Web UI - Issues |
| ISSUE-03 | 7 | Web UI - Issues |
| ISSUE-04 | 7 | Web UI - Issues |

**Coverage: 35/35 requirements mapped**

---

*Generated: 2026-04-05*
