# LeClaw State

**Project:** LeClaw - Agent Management Platform
**Last updated:** 2026-04-05

---

## Project Reference

**Core Value:** 分层 Agent 协同编排 + 实时状态监控

**Target Users:** 个人用户管理多个 AI-native 公司，处理不同业务线。无 Auth 设计。

**Current Phase:** Planning (no phases started)

**Focus:** Roadmap creation - awaiting approval to begin Phase 1 planning

---

## Current Position

### Phase Progress

| Phase | Status | Progress | Plans |
|-------|--------|----------|-------|
| 1. Foundation + CLI Init | Not started | 0/5 | 0 |
| 2. Data Layer + API Foundation | Not started | 0/7 | 0 |
| 3. OpenClaw Bridge + API | Not started | 0/6 | 0 |
| 4. Real-Time Infrastructure | Not started | 0/5 | 0 |
| 5. Web UI - Dashboard | Not started | 0/5 | 0 |
| 6. Web UI - Organization | Not started | 0/7 | 0 |
| 7. Web UI - Issues | Not started | 0/5 | 0 |
| 8. Integration + E2E Testing | Not started | 0/8 | 0 |

### Overall Progress

- **Phases:** 0/8 complete
- **Requirements:** 0/35 validated
- **Plans:** 0/8 created

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Total Phases | 8 |
| Total Requirements | 35 |
| Requirements per Phase (avg) | 4.4 |
| UI Phases | 3 (Phase 5, 6, 7) |
| Backend Phases | 5 (Phase 1, 2, 3, 4, 8) |

---

## Accumulated Context

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| Independent process connecting to OpenClaw | Does not modify OpenClaw, maintains flexibility |
| React Web UI | User specified technology stack |
| SSE for real-time updates | Reference openclaw-control-center implementation |
| Embedded PostgreSQL | Reference paperclip design |
| Fixed two-level hierarchy (Company/Department) | Simplifies complexity for MVP |
| Hybrid collaboration mode | Supports assignment + acceptance + parallel collaboration |
| Zero Auth design | Single user managing multiple companies |

### Research Flags

| Phase | Flag | Notes |
|-------|------|-------|
| Phase 3 | Needs research | OpenClaw API behavior under load, rate limits, failure modes |
| Phase 3 | Needs research | embedded-postgres beta limitations |
| Phase 7 | Needs research | Agent collaboration protocols in OpenClaw ecosystem |

### Deferred Requirements (v2)

- Issue auto-assignment based on routing rules
- CEO agent decompose goals to Managers
- Manager agents coordinate Staff for parallel execution
- Agent completion triggers automatic Issue update
- Full audit log of agent actions
- Performance metrics dashboard
- Strategy evolution engine

### Out of Scope

- Auth/Multi-tenant SaaS - Single user design
- Agent code modification - Read-only monitoring
- OpenClaw embedding - External process connection
- Nested sub-departments - Fixed two-level hierarchy
- Mobile UI - Web UI only

---

## Session Continuity

### Todo

- [ ] Approve roadmap
- [ ] Begin Phase 1 planning via `/gsd:plan-phase 1`

### Blockers

None - roadmap ready for approval

### Notes

Roadmap derived from requirements with 100% coverage validation. Fine granularity applied (8 phases).

---

## Phase Details Reference

### Phase 1: Foundation + CLI Init
**Goal:** User can initialize LeClaw project and configure OpenClaw/Gateway settings via CLI
**Dependencies:** None
**Requirements:** CLI-01, CLI-02, CLI-03, DATA-01

### Phase 2: Data Layer + API Foundation
**Goal:** All core entities persist correctly and REST API exposes Company/Department CRUD
**Dependencies:** Phase 1
**Requirements:** DATA-02, DATA-03, DATA-04, DATA-05, API-01, API-02, API-03, API-04, API-05

### Phase 3: OpenClaw Bridge + API
**Goal:** LeClaw connects to OpenClaw Gateway and surfaces agent status; Issue and Agent APIs are complete
**Dependencies:** Phase 2
**Requirements:** OPENCLAW-01, OPENCLAW-02, OPENCLAW-03, OPENCLAW-04

### Phase 4: Real-Time Infrastructure
**Goal:** Web UI receives real-time updates via SSE with reliable connection management
**Dependencies:** Phase 3
**Requirements:** RT-01, RT-02, RT-03

### Phase 5: Web UI - Dashboard
**Goal:** Users see overview of all Companies, real-time agent status, and recent activity
**Dependencies:** Phase 4
**Requirements:** UI-01, UI-02, UI-03
**UI hint:** yes

### Phase 6: Web UI - Organization
**Goal:** Users can manage Companies, Departments, and assign OpenClaw agents to roles
**Dependencies:** Phase 5
**Requirements:** UI-04, UI-05, UI-06, UI-07, UI-08, UI-09
**UI hint:** yes

### Phase 7: Web UI - Issues
**Goal:** Users can create, view, and manage Issues; external systems can create Issues via REST API
**Dependencies:** Phase 5
**Requirements:** ISSUE-01, ISSUE-02, ISSUE-03, ISSUE-04
**UI hint:** yes

### Phase 8: Integration + E2E Testing
**Goal:** All components work together end-to-end; critical user workflows are verified
**Dependencies:** Phase 7
**Requirements:** Cross-phase integration

---

*Last updated: 2026-04-05*
