# Phase 5: Web UI - Layout + Dashboard - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Basic layout with Company Rail, Sidebar, and Dashboard showing current company's real-time status.

**Scope:**
- Company Rail on left side with company avatars
- Sidebar with navigation: Dashboard, Issues, Goals, Projects, Approvals, Departments
- Dashboard shows current **Company** data (Company layer, not system-wide):
  - Departments count
  - Agents status (Online/Total/Busy)
  - Issues breakdown (Open/In Progress/Done)
- Navigation between pages works
- SSE for real-time updates with auto-reconnect

**Out of scope for this phase:**
- Full entity pages (Phase 6)

</domain>

<decisions>
## Implementation Decisions

### Component Library
- **D-01:** UI library = **shadcn/ui**
- **D-02:** Base: Tailwind CSS + Radix UI primitives
- **Rationale:** Fast development, pre-built components, Tailwind already in mock-ui

### Routing
- **D-03:** Router = **React Router**
- **D-04:** Routes:
  - `/` — redirect to `/dashboard`
  - `/dashboard` — Company dashboard
  - `/issues` — Issues list
  - `/goals` — Goals list
  - `/projects` — Projects list
  - `/approvals` — Approvals list
  - `/departments` — Departments list
  - `/departments/:id` — Department detail

### Dashboard Scope
- **D-05:** Dashboard = **Company layer** (not system-wide)
- **D-06:** Shows data for currently selected Company only
- **D-07:** Dashboard metrics for current company:
  - Company name
  - Departments count
  - Agents breakdown: Online / Busy / Offline
  - Issues breakdown: Open / In Progress / Done

### Layout Dimensions
- **D-08:** Company Rail width = **72px** (fixed)
- **D-09:** Sidebar width = **240px** (fixed)
- **D-10:** Main content area = remaining space (flex-1)

### SSE (Real-time Updates)
- **D-11:** SSE endpoint: `/api/events` (from Phase 4)
- **D-12:** **Auto-reconnect** on connection drop
- **D-13:** Company context sent via query param or cookie
- **D-14:** Re-subscribe on company switch
- **Rationale:** Per SPEC RT-03: Web UI reconnects automatically after SSE connection drop

### Data Fetching
- **D-15:** Initial data load via REST API (no SSE for initial fetch)
- **D-16:** Real-time updates via SSE after initial load

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/SPEC.md` — Dashboard, real-time updates
- `.planning/ROADMAP.md` — Phase 5 success criteria
- `.planning/REQUIREMENTS.md` — UI-01, UI-02, UI-03, RT-01, RT-02, RT-03
- `.planning/phases/04-rest-api-sse/04-CONTEXT.md` — SSE endpoint, heartbeat

</canonical_refs>

<codebase_context>
## Existing Code Insights

### mock-ui Reference
- `mock-ui/src/App.tsx` — current single-state navigation
- `mock-ui/src/components/CompanyRail.tsx` — 72px rail
- `mock-ui/src/components/Sidebar.tsx` — 240px sidebar
- `mock-ui/src/components/Dashboard.tsx` — current dashboard
- Uses Tailwind CSS + lucide-react

### shadcn/ui Components to Use
- Card (for metric boxes)
- Table (for agent status, recent issues)
- Button
- Badge (for status indicators)
- Avatar (for company rail)
- Sidebar (shadcn has sidebar component)

### Integration Points
- `packages/web/` — React app with shadcn/ui
- SSE EventSource connects to `http://localhost:{port}/api/events`
- REST API base: `http://localhost:{port}/api`

</codebase_context>

<specifics>
## Specific Ideas

**Dashboard Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Company │ Sidebar │        Main Content             │
│  Rail  │  240px  │                                │
│  72px  │         │  ┌──────┐ ┌──────┐ ┌──────┐   │
│         │         │  │ Depts│ │Agents│ │Issues│   │
│ [Avatars│ [Nav]   │  └──────┘ └──────┘ └──────┘   │
│         │         │                                │
│         │         │  ┌─────────────────────────┐   │
│         │         │  │    Recent Issues       │   │
│         │         │  └─────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**SSE Event Types for Dashboard:**
- `agent_status_changed` — update agent status
- `issue_updated` — update issue counts
- `department_updated` — update department count

</specifics>

<deferred>
## Deferred Ideas

- System-wide aggregate dashboard — not needed for v1
- Multiple company comparison — out of scope

</deferred>

---

*Phase: 05-web-ui-layout-dashboard*
*Context gathered: 2026-04-07*
