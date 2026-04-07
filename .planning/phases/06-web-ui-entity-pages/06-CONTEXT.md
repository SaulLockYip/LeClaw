# Phase 6: Web UI - Entity Pages - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Full pages for all entities with list and detail views.

**Scope:**
- Issues Page: List with filters, detail view with sub-issues and comments
- Goals Page: List with filters, detail showing related issues
- Projects Page: List with projectDir, detail view
- Approvals Page: List with approve/reject actions (row-level + dialog confirmation)
- Departments Page: Department detail with Manager and Staff lists

### Web UI Read-Only Policy (CRITICAL)
- **D-15:** Web UI is **read-only** for all entities except Approvals
- **D-16:** No Create/Edit/Delete via Web UI — all write operations via CLI only
- **D-17:** Entity pages display data only; no forms for create/update
- **Rationale:** Agent writes via CLI; Human reads via Web UI; only Approval has human write via Web UI

### Approval Write Access (CRITICAL)
- **D-18:** Approval approve/reject = **Web UI write** (human)
- **D-19:** Approval create = **CLI only** (agent)

**Out of scope for this phase:**
- Harness Infrastructure (Phase 7)

</domain>

<decisions>
## Implementation Decisions

### List View
- **D-01:** Issues/Goals/Projects = **Table** (data-dense)
- **D-02:** Approvals = **Card** list (less data per item)
- **D-03:** Tables use shadcn/ui Table component

### Filters
- **D-04:** Filter UI = **Table header dropdowns** (simple, inline)
- **D-05:** Common filters per entity:
  - Issues: Status (All/Open/In Progress/Done), Department
  - Goals: Status (All/Open/Achieved/Archived)
  - Projects: Status
  - Approvals: Status (All/Pending/Approved/Rejected)

### Detail View
- **D-06:** Detail View = **Full page** with route `/entity/:id`
- **D-07:** Back button returns to list
- **D-08:** Entity-specific detail content per SPEC models

### Create/Edit Forms
- **D-09:** Create = **Dialog** (quick, modal)
- **D-10:** Edit = **Full page** (`/entity/:id/edit`)
- **Rationale:** Create is frequent + simple; Edit may be complex

### Approvals Special Handling
- **D-11:** Approve/Reject = **Row-level buttons** for quick access
- **D-12:** Click opens **Confirmation Dialog** showing:
  - Approval title
  - Description
  - Requester info
  - Confirm / Cancel buttons
- **D-13:** Reject requires **reason text input** in dialog
- **Rationale:** Balance convenience (row-level) with confirmation (dialog)

### Entity Routes
- **D-14:** Routes:
  - `/issues` — list
  - `/issues/:id` — detail
  - `/issues/new` — create dialog → returns to list
  - `/goals` — list
  - `/goals/:id` — detail
  - `/projects` — list
  - `/projects/:id` — detail
  - `/approvals` — list (action happens here)
  - `/departments` — list
  - `/departments/:id` — detail

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/SPEC.md` — Entity models, Approval flow
- `.planning/ROADMAP.md` — Phase 6 success criteria
- `.planning/REQUIREMENTS.md` — UI-04 to UI-09
- `.planning/phases/05-web-ui-layout-dashboard/05-CONTEXT.md` — Layout, shadcn/ui, React Router

</canonical_refs>

<codebase_context>
## Existing Code Insights

### mock-ui Reference
- `mock-ui/src/pages/IssuesPage.tsx` — current issues list
- `mock-ui/src/pages/GoalsPage.tsx` — current goals list
- `mock-ui/src/pages/ProjectsPage.tsx` — current projects list
- `mock-ui/src/pages/ApprovalsPage.tsx` — current approvals list
- `mock-ui/src/pages/DepartmentsPage.tsx` — department detail

### shadcn/ui Components to Use
- Table (for lists)
- Card (for approvals, dashboard stats)
- Dialog (for create, approve confirmation)
- AlertDialog (for destructive confirmations like reject)
- DropdownMenu (for filters)
- Badge (for status)
- Button (row actions)

### Integration Points
- REST API endpoints from Phase 4
- SSE for real-time updates
- React Router for navigation

</codebase_context>

<specifics>
## Specific Ideas

**Issue Detail Page:**
- Title, description, status badge
- Assignee info
- Sub-issues list (from JSONB array)
- Comments section (separate table)
- Report (Markdown rendered)
- Status change dropdown

**Goal Detail Page:**
- Title, description, status
- Verification text
- Deadline
- Related Issues list
- Department involvement

**Approval Confirmation Dialog:**
```
┌─────────────────────────────────┐
│ Approve this request?           │
│                                 │
│ Title: Hardware Upgrade         │
│ Requester: Alice (CEO Agent)    │
│                                 │
│ [Cancel]         [Approve]      │
└─────────────────────────────────┘
```

**Reject Dialog:**
```
┌─────────────────────────────────┐
│ Reject this request?            │
│                                 │
│ Title: Hardware Upgrade         │
│ Requester: Alice (CEO Agent)    │
│                                 │
│ Reason: [________________]      │
│                                 │
│ [Cancel]        [Reject]        │
└─────────────────────────────────┘
```

</specifics>

<deferred>
## Deferred Ideas

- Bulk approve/reject — not in v1 scope
- Approval workflow customization — deferred to harness configuration (Phase 7)

</deferred>

---

*Phase: 06-web-ui-entity-pages*
*Context gathered: 2026-04-07*
