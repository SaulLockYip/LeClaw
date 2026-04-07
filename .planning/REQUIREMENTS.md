# LeClaw Requirements

## v1 Requirements

### CLI

- [ ] **CLI-01**: User can run `leclaw init` to initialize the configuration directory (`~/.leclaw/`)
- [ ] **CLI-02**: User can run `leclaw config openclaw --dir <path>` to configure the OpenClaw directory
- [ ] **CLI-03**: User can run `leclaw config gateway --url <url> --key <key>` to configure Gateway address and API key
- [ ] **CLI-04**: User can run `leclaw start` to start the LeClaw server (backend + web UI)
- [ ] **CLI-05**: User can run `leclaw status` to view connection status to OpenClaw and Gateway

### Data Layer

- [ ] **DATA-01**: LeClaw initializes embedded PostgreSQL database on first run
- [ ] **DATA-02**: Company entity can be created, read, updated, deleted
- [ ] **DATA-03**: Department entity can be created, read, updated, deleted under a Company
- [ ] **DATA-04**: Agent binding relationship (CEO/Manager/Staff -> OpenClaw agent) is stored and retrieved
- [ ] **DATA-05**: Issue entity can be created and listed (title, description, status, assignee)

### OpenClaw Connection

- [ ] **OPENCLAW-01**: LeClaw scans configured OpenClaw directory to discover all available agents
- [ ] **OPENCLAW-02**: LeClaw polls OpenClaw Gateway for agent status at configurable intervals
- [ ] **OPENCLAW-03**: LeClaw maintains heartbeat with OpenClaw agents to verify liveness
- [ ] **OPENCLAW-04**: Agent status changes trigger SSE events to connected Web UI clients

### Web UI - Dashboard

- [ ] **UI-01**: Dashboard displays summary of all Companies and their Department counts
- [ ] **UI-02**: Dashboard displays real-time status of all detected OpenClaw agents
- [ ] **UI-03**: Dashboard shows recent Issues and their states

### Web UI - Organization

- [ ] **UI-04**: User can view list of Companies and create a new Company
- [ ] **UI-05**: User can view a Company's detail page with CEO agent assigned
- [ ] **UI-06**: User can view Company's Departments and create a new Department
- [ ] **UI-07**: User can assign a Manager agent to a Department from available OpenClaw agents
- [ ] **UI-08**: User can assign one or more Staff agents to a Department from available OpenClaw agents
- [ ] **UI-09**: User can reassign or unbind any agent from their role

### Web UI - Issues

- [ ] **ISSUE-01**: User can create an Issue from Web UI (title, description, target Department)
- [ ] **ISSUE-02**: User can view list of all Issues with filtering by Company/Department
- [ ] **ISSUE-03**: User can view Issue detail and change its status (open, in-progress, done)
- [ ] **ISSUE-04**: External systems can create Issues via REST API with API key authentication

### Real-Time Updates

- [ ] **RT-01**: Web UI receives real-time updates via SSE when agent status changes
- [ ] **RT-02**: SSE connections include heartbeat to prevent load balancer timeout
- [ ] **RT-03**: Web UI reconnects automatically after SSE connection drop

### REST API

- [ ] **API-01**: REST API exposes Company CRUD operations
- [ ] **API-02**: REST API exposes Department CRUD operations
- [ ] **API-03**: REST API exposes Issue CRUD operations
- [ ] **API-04**: REST API exposes OpenClaw agent list and status
- [ ] **API-05**: API endpoints return proper error responses with error codes

## v2 Requirements (Deferred)

- [ ] **V2-01**: Issues automatically assigned to appropriate Department agents based on routing rules
- [ ] **V2-02**: CEO agent can decompose a goal and distribute subtasks to Manager agents
- [ ] **V2-03**: Manager agents coordinate Staff agents for parallel task execution
- [ ] **V2-04**: Agent completion triggers automatic Issue status update and notification
- [ ] **V2-05**: Full audit log of all agent actions and decisions
- [ ] **V2-06**: Performance metrics dashboard for agent execution times
- [ ] **V2-07**: Strategy evolution engine adjusts agent behavior based on success/failure patterns

## Out of Scope

- **Auth/Multi-tenant SaaS** - Single user design, no authentication required
- **Agent code modification** - LeClaw reads and monitors OpenClaw agents only, does not modify them
- **OpenClaw embedding** - LeClaw connects to external OpenClaw instances as a separate process
- **Nested sub-departments** - Fixed Company -> Department two-level hierarchy only
- **Mobile UI** - Web UI only (desktop browser)

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLI-01 | Phase 1 - Foundation + CLI Init | Pending |
| CLI-02 | Phase 1 - Foundation + CLI Init | Pending |
| CLI-03 | Phase 1 - Foundation + CLI Init | Pending |
| DATA-01 | Phase 1 - Foundation + CLI Init | Completed |
| DATA-02 | Phase 2 - Data Layer + API Foundation | Completed |
| DATA-03 | Phase 2 - Data Layer + API Foundation | Completed |
| DATA-04 | Phase 2 - Data Layer + API Foundation | Completed |
| DATA-05 | Phase 2 - Data Layer + API Foundation | Completed |
| API-01 | Phase 2 - Data Layer + API Foundation | Pending |
| API-02 | Phase 2 - Data Layer + API Foundation | Pending |
| API-03 | Phase 2 - Data Layer + API Foundation | Pending |
| API-04 | Phase 2 - Data Layer + API Foundation | Pending |
| API-05 | Phase 2 - Data Layer + API Foundation | Pending |
| OPENCLAW-01 | Phase 3 - OpenClaw Bridge + API | Completed |
| OPENCLAW-02 | Phase 3 - OpenClaw Bridge + API | Completed |
| OPENCLAW-03 | Phase 3 - OpenClaw Bridge + API | Completed |
| OPENCLAW-04 | Phase 3 - OpenClaw Bridge + API | Completed |
| RT-01 | Phase 4 - Real-Time Infrastructure | Pending |
| RT-02 | Phase 4 - Real-Time Infrastructure | Pending |
| RT-03 | Phase 4 - Real-Time Infrastructure | Pending |
| UI-01 | Phase 5 - Web UI - Dashboard | Pending |
| UI-02 | Phase 5 - Web UI - Dashboard | Pending |
| UI-03 | Phase 5 - Web UI - Dashboard | Pending |
| UI-04 | Phase 6 - Web UI - Organization | Pending |
| UI-05 | Phase 6 - Web UI - Organization | Pending |
| UI-06 | Phase 6 - Web UI - Organization | Pending |
| UI-07 | Phase 6 - Web UI - Organization | Pending |
| UI-08 | Phase 6 - Web UI - Organization | Pending |
| UI-09 | Phase 6 - Web UI - Organization | Pending |
| ISSUE-01 | Phase 7 - Web UI - Issues | Pending |
| ISSUE-02 | Phase 7 - Web UI - Issues | Pending |
| ISSUE-03 | Phase 7 - Web UI - Issues | Pending |
| ISSUE-04 | Phase 7 - Web UI - Issues | Pending |
| V2-01 to V2-07 | Future | Deferred |

**Coverage: 35/35 v1 requirements mapped to phases**

---

*Generated: 2026-04-05*
*Last updated: 2026-04-05 (roadmap created)*
